import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DraftEditor from "@/app/(workspace)/components/draft-editor";
import type { InboxItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

vi.mock("@/app/(workspace)/hooks/useAutosaveDraft", () => ({
  useAutosaveDraft: () => ({ isSaving: false })
}));

function createDraft(overrides?: Partial<InboxItem>): InboxItem {
  return {
    id: "inbox-1",
    title: "測試草稿",
    content: "內容",
    hint: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ updatedAt: new Date().toISOString() })))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  useWorkspaceStore.setState({ isLoading: false, editorDirty: false, lastSavedAt: null });
});

describe("DraftEditor 大型貼上 loading 指示", () => {
  it("超過閾值時顯示 loading 並在 500ms 後關閉", async () => {
    render(
      <DraftEditor
        draft={createDraft()}
        projects={[{ id: "p1", name: "AI 工作流課程", status: "進行中", promptCount: 0, updatedAt: "" }]}
        onArchived={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText("開始撰寫或貼上草稿內容，系統將自動儲存") as HTMLTextAreaElement;

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => "x".repeat(100001)
      }
    } as any);

    expect(screen.getByText("大型貼上處理中…")).toBeInTheDocument();
    expect(useWorkspaceStore.getState().isLoading).toBe(true);
  });
});
