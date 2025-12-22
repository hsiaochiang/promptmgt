import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

const originalPageSizeEnv = {
  INBOX_PAGE_SIZE: process.env.INBOX_PAGE_SIZE,
  NEXT_PUBLIC_INBOX_PAGE_SIZE: process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE
};

function makeInbox(total: number) {
  return Array.from({ length: total }).map((_, idx) => {
    const ts = new Date(2025, 0, idx + 1).toISOString();
    return {
      id: `inbox-${idx}`,
      title: `草稿 ${idx}`,
      content: `內容 ${idx}`,
      hint: "",
      createdAt: ts,
      updatedAt: ts
    };
  });
}

describe("收件匣分頁/搜尋整合", () => {
  let restoreWorkspace: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE = "20";
    process.env.INBOX_PAGE_SIZE = "20";
    vi.resetModules();

    restoreWorkspace = await setupIsolatedWorkspace();
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox = makeInbox(120);
    await db.write();

    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const raw = typeof input === "string" ? input : "url" in input ? input.url : input.toString();
      const url = new URL(raw, "http://localhost");
      if (url.pathname.startsWith("/api/inbox")) {
        const { GET } = await import("@/app/api/inbox/route");
        return GET(new Request(url.toString(), { method: init?.method ?? "GET" }));
      }
      return new Response("not mocked", { status: 500 });
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    process.env.INBOX_PAGE_SIZE = originalPageSizeEnv.INBOX_PAGE_SIZE;
    process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE = originalPageSizeEnv.NEXT_PUBLIC_INBOX_PAGE_SIZE;
    cleanup();
    if (restoreWorkspace) await restoreWorkspace();
  });

  it("顯示提示文案、可翻頁並跨頁搜尋", async () => {
    const InboxList = (await import("@/app/(workspace)/components/inbox-list")).default;
    const onLoaded = vi.fn();

    render(<InboxList selectedId={null} onSelect={vi.fn()} onLoaded={onLoaded} refreshKey={0} />);

    await screen.findByText("草稿超過 100 筆，請使用搜尋或分頁逐步整理，避免介面過載。");
    await screen.findByText(/顯示 1-20 \/ 共 120 筆/);

    fireEvent.click(screen.getByText("下一頁"));
    await screen.findByText(/顯示 21-40 \/ 共 120 筆/);

    fireEvent.change(screen.getByPlaceholderText("搜尋草稿標題/內容"), {
      target: { value: "草稿 105" }
    });
    fireEvent.click(screen.getByText("搜尋/過濾"));

    await screen.findByText(/顯示 1-1 \/ 共 1 筆/);
    expect(screen.getByText("草稿 105")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("搜尋草稿標題/內容"), {
      target: { value: "不存在的草稿" }
    });
    fireEvent.click(screen.getByText("搜尋/過濾"));
    await waitFor(() => expect(screen.getByText("沒有符合條件的草稿")).toBeInTheDocument());

    expect(onLoaded).toHaveBeenCalled();
  });
});
