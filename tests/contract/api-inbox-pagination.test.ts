import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;
const originalPageSizeEnv = {
  INBOX_PAGE_SIZE: process.env.INBOX_PAGE_SIZE,
  NEXT_PUBLIC_INBOX_PAGE_SIZE: process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE
};

const isIsoUtc8 = (value?: string | null) =>
  typeof value === "string" && /\+08:00$/.test(value) && !Number.isNaN(Date.parse(value));

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

describe("/api/inbox 分頁與搜尋 (Edge Case)", () => {
  beforeEach(async () => {
    restoreWorkspace = await setupIsolatedWorkspace();
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox = makeInbox(120);
    await db.write();
  });

  afterEach(async () => {
    process.env.INBOX_PAGE_SIZE = originalPageSizeEnv.INBOX_PAGE_SIZE;
    process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE = originalPageSizeEnv.NEXT_PUBLIC_INBOX_PAGE_SIZE;
    if (restoreWorkspace) await restoreWorkspace();
  });

  it("預設 50/頁，超過 100 筆時仍只回第一頁並回報 hasMore", async () => {
    const { GET } = await import("@/app/api/inbox/route");
    const { getInboxPageSize } = await import("@/lib/utils/config");

    const res = await GET(new Request("http://localhost/api/inbox"));
    const payload = await res.json();

    expect(payload.items).toHaveLength(getInboxPageSize());
    expect(payload.total).toBe(120);
    expect(payload.hasMore).toBe(true);
    expect(payload.offset).toBe(0);
    expect(isIsoUtc8(payload.items[0]?.createdAt)).toBe(true);
    expect(isIsoUtc8(payload.items[0]?.updatedAt)).toBe(true);
  });

  it("搜尋需跨頁，命中後頁資料仍能返回單一結果", async () => {
    const { GET } = await import("@/app/api/inbox/route");

    const res = await GET(new Request("http://localhost/api/inbox?q=草稿 115"));
    const payload = await res.json();

    expect(payload.total).toBe(1);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].id).toBe("inbox-115");
    expect(payload.hasMore).toBe(false);
    expect(isIsoUtc8(payload.items[0]?.createdAt)).toBe(true);
    expect(isIsoUtc8(payload.items[0]?.updatedAt)).toBe(true);
  });

  it("頁大小可經環境變數調整，未提供 limit 也使用配置值", async () => {
    process.env.INBOX_PAGE_SIZE = "20";
    process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE = "20";
    vi.resetModules();

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox = makeInbox(120);
    await db.write();

    const { GET } = await import("@/app/api/inbox/route");
    const res = await GET(new Request("http://localhost/api/inbox"));
    const payload = await res.json();

    expect(payload.items).toHaveLength(20);
    expect(payload.hasMore).toBe(true);
  });
});
