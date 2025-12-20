import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosavePrompt } from "@/app/(workspace)/hooks/useAutosavePrompt";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

const fm: PromptFrontmatter = {
  title: "提示",
  project: "proj-1",
  type: "其他",
  status: "使用中",
  model: "gpt-4o-mini",
  tags: [],
  updatedAt: "2025-01-01"
};

describe("useAutosavePrompt 前言自動保存", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWorkspaceStore.setState({ lastSavedAt: null, editorDirty: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    useWorkspaceStore.setState({ lastSavedAt: null, editorDirty: false });
  });

  it("frontmatter 變更會在延遲後 POST 儲存", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ hash: "next-hash", updatedAt: "2025-02-02T00:00:00Z" }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    type HookProps = Parameters<typeof useAutosavePrompt>[0];
    const initialProps: HookProps = {
      promptId: "p-1",
      frontmatter: fm,
      body: "body",
      clientHash: "old-hash",
      delay: 10,
      onSaved: vi.fn(),
      onConflict: vi.fn()
    };

    const { rerender } = renderHook(
      (props: HookProps) => useAutosavePrompt(props),
      {
        initialProps
      }
    );

    // frontmatter 更新
    rerender({
      ...initialProps,
      frontmatter: { ...fm, status: "草稿" }
    });

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/prompts/p-1",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ frontmatter: { ...fm, status: "草稿" }, body: "body", clientHash: "old-hash" })
      })
    );
    expect(useWorkspaceStore.getState().lastSavedAt).toBe("2025-02-02T00:00:00Z");
  });
});
