import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosaveDraft } from "@/app/(workspace)/hooks/useAutosaveDraft";

describe("useAutosaveDraft Hook 節奏測試", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ updatedAt: new Date().toISOString() }))
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("當內容變更時應延遲 2 秒執行自動儲存", async () => {
    const { rerender } = renderHook(
      (props) => useAutosaveDraft(props),
      {
        initialProps: {
          draftId: "1",
          title: "Title",
          content: "Content",
          hint: "Hint",
          delay: 2000,
        },
      }
    );

    // 第一次渲染後不應立即觸發
    expect(fetch).not.toHaveBeenCalled();

    // 模擬內容變更
    rerender({
      draftId: "1",
      title: "Title",
      content: "New Content",
      hint: "Hint",
      delay: 2000,
    });

    // 1秒後仍不應觸發
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fetch).not.toHaveBeenCalled();

    // 再 1秒後 (總共 2秒) 應觸發
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("連續輸入應重置計時器 (Debounce)", async () => {
    const { rerender } = renderHook(
      (props) => useAutosaveDraft(props),
      {
        initialProps: {
          draftId: "1",
          title: "Title",
          content: "1",
          hint: "Hint",
          delay: 2000,
        },
      }
    );

    // 1.5秒後輸入新內容
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    rerender({
      draftId: "1",
      title: "Title",
      content: "12",
      hint: "Hint",
      delay: 2000,
    });

    // 再過 1秒 (距離第一次 2.5秒，但距離第二次僅 1秒) 不應觸發
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(fetch).not.toHaveBeenCalled();

    // 再過 1秒 (距離第二次 2秒) 應觸發
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
