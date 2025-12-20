import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosavePrompt } from "@/app/(workspace)/hooks/useAutosavePrompt";

describe("useAutosavePrompt Hook 節奏與 Hash 傳遞測試", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ 
          hash: "new-hash", 
          updatedAt: new Date().toISOString() 
        }))
      )
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("當內容變更時應延遲 2 秒執行自動儲存並回傳新 Hash", async () => {
    const onSaved = vi.fn();
    const { rerender } = renderHook(
      (props) => useAutosavePrompt(props),
      {
        initialProps: {
          promptId: "p1",
          frontmatter: { project: "Test" } as any,
          body: "Initial",
          clientHash: "old-hash",
          delay: 2000,
          onSaved
        },
      }
    );

    // 模擬內容變更
    rerender({
      promptId: "p1",
      frontmatter: { project: "Test" } as any,
      body: "Changed",
      clientHash: "old-hash",
      delay: 2000,
      onSaved
    });

    // 2秒後應觸發 fetch
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);
    expect(body.clientHash).toBe("old-hash");
    
    // 應呼叫 onSaved 並帶入新 Hash
    expect(onSaved).toHaveBeenCalledWith("new-hash");
  });

  it("偵測到 409 衝突時應設定錯誤訊息且不呼叫 onSaved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "Conflict", currentHash: "server-hash" }), { status: 409 }))
    );

    const onSaved = vi.fn();
    const onConflict = vi.fn();
    const { result, rerender } = renderHook(
      (props) => useAutosavePrompt(props),
      {
        initialProps: {
          promptId: "p1",
          frontmatter: { project: "Test" } as any,
          body: "Initial",
          clientHash: "hash",
          onSaved,
          onConflict
        },
      }
    );

    rerender({
      promptId: "p1",
      frontmatter: { project: "Test" } as any,
      body: "Conflict Change",
      clientHash: "hash",
      onSaved,
      onConflict
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.error).toContain("發現外部變更");
    expect(onSaved).not.toHaveBeenCalled();
    expect(onConflict).toHaveBeenCalledWith("server-hash");
  });

  it("無輸入時不重複儲存，恢復輸入後重新計時", async () => {
    const { rerender } = renderHook(
      (props) => useAutosavePrompt(props),
      {
        initialProps: {
          promptId: "p1",
          frontmatter: { project: "Test" } as any,
          body: "Initial",
          clientHash: "hash",
          delay: 2000,
        },
      }
    );

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    rerender({
      promptId: "p1",
      frontmatter: { project: "Test" } as any,
      body: "Changed again",
      clientHash: "hash",
      delay: 2000,
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
