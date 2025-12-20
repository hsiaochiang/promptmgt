import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import InboxList from "@/app/(workspace)/components/inbox-list";
import type { InboxItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

function makeItems(count: number, page = 0): InboxItem[] {
  return Array.from({ length: count }).map((_, idx) => {
    const id = page * 50 + idx;
    return {
      id: `inbox-${id}`,
      title: `草稿 ${id}`,
      content: `內容 ${id}`,
      hint: "",
      createdAt: new Date(2024, 0, id + 1).toISOString(),
      updatedAt: new Date(2024, 0, id + 1).toISOString()
    };
  });
}

describe("InboxList 分頁與搜尋提示", () => {
  beforeEach(() => {
    const responses = [
      { items: makeItems(50, 0), total: 120, hasMore: true },
      { items: makeItems(50, 1), total: 120, hasMore: true },
      { items: [makeItems(1, 0)[0]], total: 1, hasMore: false }
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(responses.shift() ?? { items: [], total: 0 })))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
    useWorkspaceStore.setState({ inboxCount: 0 });
  });

  it("超過 100 筆時顯示提示，可翻頁並用搜尋收斂結果", async () => {
    const onLoaded = vi.fn();

    render(
      <InboxList selectedId={null} onSelect={vi.fn()} onLoaded={onLoaded} refreshKey={0} />
    );

    await screen.findByText("草稿超過 100 筆，請使用搜尋或分頁逐步整理，避免介面過載。");
    expect(screen.getByText(/顯示 1-50 \/ 共 120 筆/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("下一頁"));
    await waitFor(() => expect(screen.getByText(/顯示 51-100 \/ 共 120 筆/)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("搜尋草稿標題/內容"), {
      target: { value: "草稿 0" }
    });
    fireEvent.click(screen.getByText("搜尋/過濾"));

    await waitFor(() => expect(screen.getByText(/共 1 筆/)).toBeInTheDocument());
    expect(onLoaded).toHaveBeenCalledTimes(3);
  });
});
