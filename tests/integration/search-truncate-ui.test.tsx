import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import SearchResultsPanel from "@/app/(workspace)/components/search-results-panel";
import InboxList from "@/app/(workspace)/components/inbox-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

describe("T090 - 截斷與分頁提示 UI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
    useWorkspaceStore.setState({ inboxCount: 0 });
  });

  it("搜尋結果截斷時顯示收斂提示", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: "p-1",
                title: "截斷測試",
                projectId: "proj-1",
                status: "使用中",
                model: "gpt-4o",
                tags: ["demo"],
                snippet: "截斷測試 snippet"
              }
            ],
            truncated: true
          })
        );
      })
    );

    render(<SearchResultsPanel query="截斷" />);

    await screen.findByTestId("search-truncated");
    expect(screen.getByText("截斷測試")).toBeInTheDocument();
  });

  it("收件匣超過 100 筆時顯示整理提示並維持空態文案", async () => {
    const responses = [
      { items: [], total: 120, hasMore: true, limit: 50, offset: 0 }
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(responses.shift() ?? { items: [], total: 0, hasMore: false, limit: 50, offset: 0 })))
    );

    render(<InboxList selectedId={null} onSelect={vi.fn()} onLoaded={vi.fn()} refreshKey={0} />);

    await screen.findByText("草稿超過 100 筆，請使用搜尋或分頁逐步整理，避免介面過載。");
    await screen.findByText("沒有符合條件的草稿");
    expect(useWorkspaceStore.getState().inboxCount).toBe(120);
  });
});
