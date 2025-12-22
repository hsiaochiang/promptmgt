import React, { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import SnippetPanel from "@/app/(workspace)/components/snippet-panel";
import PromptEditor from "@/app/(workspace)/components/prompt-editor";
import { useSnippetInsert } from "@/app/(workspace)/hooks/useSnippetInsert";
import type { Snippet } from "@/lib/types/schema";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

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
      return GET(new Request(absolute, { method: init?.method ?? "GET" }));
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

function DrawerHarness() {
  const [insertText, setInsertText] = useState<string | null>(null);
  const [body, setBody] = useState("寫點內容保持狀態");
  const { insertSnippet } = useSnippetInsert((content) => setInsertText(content));
  const toggleSnippetPanel = useWorkspaceStore((s) => s.toggleSnippetPanel);
  const isSnippetPanelOpen = useWorkspaceStore((s) => s.isSnippetPanelOpen);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.altKey && key === "s") {
        event.preventDefault();
        toggleSnippetPanel();
      }
      if (key === "escape" && isSnippetPanelOpen) {
        toggleSnippetPanel(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSnippetPanel, isSnippetPanelOpen]);

  return (
    <div>
      <div data-testid="snippet-drawer" data-open={isSnippetPanelOpen}>
        <SnippetPanel onInsert={insertSnippet} />
      </div>
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
        initialBody={body}
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

    await waitFor(() => expect(screen.queryByText("載入中…")).not.toBeInTheDocument(), { timeout: 5000 });

    const card = await screen.findByText("角色設定－資深系統分析顧問", {}, { timeout: 5000 });
    const cardContainer = card.closest("div")?.parentElement?.parentElement as HTMLElement;
    const usageText = cardContainer.textContent ?? "";
    const initialUsage = parseInt(usageText.match(/使用\s+(\d+)/)?.[1] ?? "0", 10);

    const insertButtons = within(cardContainer).getAllByRole("button", { name: "插入" });
    fireEvent.click(insertButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("body-preview")).toHaveTextContent(/系統分析與網站規劃顧問/);
    });

    const updatedCard = await screen.findByText("角色設定－資深系統分析顧問");
    const updatedContainer = updatedCard.closest("div")?.parentElement?.parentElement as HTMLElement;
    const updatedText = updatedContainer.textContent ?? "";
    const updatedUsage = parseInt(updatedText.match(/使用\s+(\d+)/)?.[1] ?? "0", 10);
    expect(updatedUsage).toBe(initialUsage + 1);
  });

  it("Alt+S/Esc 切換 Drawer 不會重置編輯器內容", async () => {
    render(<DrawerHarness />);

    const preview = screen.getByTestId("body-preview");
    expect(preview).toHaveTextContent("寫點內容保持狀態");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("snippet-drawer")).toHaveAttribute("data-open", "false");
    expect(preview).toHaveTextContent("寫點內容保持狀態");

    fireEvent.keyDown(window, { key: "s", altKey: true });
    expect(screen.getByTestId("snippet-drawer")).toHaveAttribute("data-open", "true");
    expect(preview).toHaveTextContent("寫點內容保持狀態");
  });
});
