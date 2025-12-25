import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { Buffer } from "node:buffer";
import "@testing-library/jest-dom/vitest";
import PromptEditor from "@/app/(workspace)/components/prompt-editor";
import { parsePrompt } from "@/lib/utils/frontmatter";
import { setupIsolatedWorkspace } from "../utils/testEnv";

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const MockEditor = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
      <textarea data-testid="cm" value={value} onChange={(e) => onChange(e.target.value)} />
    );
    return MockEditor;
  }
}));

vi.mock("@/app/(workspace)/store/useWorkspaceStore", () => ({
  useWorkspaceStore: (selector: any) =>
    selector({
      setEditorDirty: vi.fn(),
      lastSavedAt: null
    })
}));

vi.mock("@/app/(workspace)/hooks/useAutosavePrompt", () => ({
  useAutosavePrompt: () => ({ isSaving: false, error: null })
}));

describe("Frontmatter 損壞修復流程", () => {
  let restoreWorkspace: (() => Promise<void>) | undefined;
  let promptId: string;
  let filePath: string;

  beforeEach(async () => {
    restoreWorkspace = await setupIsolatedWorkspace();
    const root = process.env.DEFAULT_ROOT!;
    filePath = join(root, "AI 工作流課程", "Broken.md");
    await fs.mkdir(dirname(filePath), { recursive: true });
    const broken = `---\ntitle: "損壞的 [\nproject: AI 工作流課程\n---\n需要修復的內容`;
    await fs.writeFile(filePath, broken, "utf8");
    promptId = Buffer.from(filePath, "utf8").toString("base64url");

    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = typeof input === "string" ? input : "url" in input ? input.url : input.toString();
      const absolute = new URL(raw, "http://localhost").toString();
      if (absolute.includes(`/api/prompts/${promptId}`)) {
        if (!init || !init.method || init.method === "GET") {
          const { GET } = await import("@/app/api/prompts/[id]/route");
          return GET(new Request(absolute, { method: "GET" }), { params: { id: promptId } });
        }
        const { POST } = await import("@/app/api/prompts/[id]/route");
        return POST(new Request(absolute, { method: "POST", ...init }), { params: { id: promptId } });
      }
      if (absolute.includes("/api/telemetry")) return new Response("ok", { status: 200 });
      return new Response("not mocked", { status: 500 });
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    if (restoreWorkspace) await restoreWorkspace();
  });

  it("降級顯示並可一鍵修復為有效 frontmatter", async () => {
    const { GET } = await import("@/app/api/prompts/[id]/route");
    const res = await GET(new Request(`http://localhost/api/prompts/${promptId}`), { params: { id: promptId } });
    const data = await res.json();

    expect(data.damaged).toBe(true);

    render(
      <PromptEditor
        promptId={promptId}
        initialFrontmatter={data.frontmatter}
        initialBody={data.body}
        clientHash={data.hash}
        initialMtimeMs={data.mtimeMs}
        initialDamaged={data.damaged}
        initialParseErrorCode={data.errorCode}
        initialParseErrorMessage={data.errorMessage}
      />
    );

    expect(await screen.findByText(/需修復/)).toBeInTheDocument();

    const repairButton = screen.getByRole("button", { name: "一鍵修復並保存" });
    fireEvent.click(repairButton);

    await waitFor(async () => {
      const updated = await fs.readFile(filePath, "utf8");
      const parsed = parsePrompt(updated, { fallbackProject: "AI 工作流課程" });
      expect(parsed.damaged).toBe(false);
      expect(parsed.frontmatter?.project).toBe("AI 工作流課程");
      expect(parsed.body.trim()).toBe("需要修復的內容");
    });

    await waitFor(() => {
      expect(screen.queryByText(/需修復/)).not.toBeInTheDocument();
    });
  });
});
