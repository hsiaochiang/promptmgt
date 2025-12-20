import React, { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import SnippetPanel from "@/app/(workspace)/components/snippet-panel";
import PromptEditor from "@/app/(workspace)/components/prompt-editor";
import { useSnippetInsert } from "@/app/(workspace)/hooks/useSnippetInsert";
import type { Snippet } from "@/lib/types/schema";

vi.mock("@/app/(workspace)/hooks/useAutosavePrompt", () => ({
  useAutosavePrompt: () => ({ isSaving: false, error: null })
}));

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea data-testid="cm" value={value} onChange={(e) => onChange(e.target.value)} />
  )
}));

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : "url" in input ? input.url : input.toString();
    const absolute = new URL(raw, "http://localhost").toString();
    if (absolute.includes("/api/snippets/") && absolute.endsWith("/usage")) {
      const id = absolute.split("/api/snippets/")[1].split("/")[0];
      const { POST } = await import("@/app/api/snippets/[id]/usage/route");
      return POST(new Request(absolute, { method: "POST", ...init }), { params: { id } });
    }
    if (absolute.includes("/api/snippets")) {
      const { GET } = await import("@/app/api/snippets/route");
      return GET();
    }
    return new Response("not mocked", { status: 500 });
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (restoreWorkspace) await restoreWorkspace();
});

function TestHarness() {
  const [insertText, setInsertText] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const { insertSnippet } = useSnippetInsert((content) => setInsertText(content));

  return (
    <div>
      <SnippetPanel onInsert={insertSnippet} />
      <PromptEditor
        promptId="prompt-1"
        initialFrontmatter={{
          title: "測試提示詞",
          project: "proj-1",
          type: "結構設計",
          status: "使用中",
          model: "gpt-4",
          tags: ["demo"],
          updatedAt: new Date().toISOString()
        }}
        initialBody=""
        clientHash={null}
        insertText={insertText}
        onInserted={() => setInsertText(null)}
        onBodyChange={(val) => setBody(val)}
      />
      <div data-testid="body-preview">{body}</div>
    </div>
  );
}

describe("US4 - 點擊片語插入並計數", () => {
  it("點擊片語會插入內容並讓 usage +1", async () => {
    render(<TestHarness />);

    const snippetButton = await screen.findByRole("button", { name: /角色設定/ });
    const initialUsage = parseInt(snippetButton.textContent?.match(/使用\s+(\d+)/)?.[1] ?? "0", 10);

    fireEvent.click(snippetButton);

    await waitFor(() => {
      expect(screen.getByTestId("body-preview")).toHaveTextContent(/系統分析與網站規劃顧問/);
    });

    const updatedText = (await screen.findByRole("button", { name: /角色設定/ })).textContent ?? "";
    const updatedUsage = parseInt(updatedText.match(/使用\s+(\d+)/)?.[1] ?? "0", 10);
    expect(updatedUsage).toBe(initialUsage + 1);
  });
});
