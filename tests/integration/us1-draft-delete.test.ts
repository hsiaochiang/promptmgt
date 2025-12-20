import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) {
    await restoreWorkspace();
  }
});

describe("US1 - 收件匣草稿刪除與列表行為", () => {
  it("DELETE 後列表與計數同步更新", async () => {
    const { getDb } = await import("@/lib/db");
    const { POST: createDraft, GET: listDrafts } = await import("@/app/api/inbox/route");
    const { DELETE: deleteDraft } = await import("@/app/api/inbox/[id]/route");

    const db = await getDb();
    db.data!.inbox = [];
    await db.write();

    const firstRes = await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "草稿一", content: "內容一" })
      })
    );
    const first = await firstRes.json();

    await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "草稿二", content: "內容二" })
      })
    );

    const deleteRes = await deleteDraft(new Request("http://localhost/api/inbox/id", { method: "DELETE" }), {
      params: { id: first.id }
    });
    expect(deleteRes.status).toBe(200);

    const listRes = await listDrafts(new Request("http://localhost/api/inbox?limit=200"));
    const payload = await listRes.json();
    const items = Array.isArray(payload) ? payload : payload.items;
    const total = Array.isArray(payload) ? items.length : payload.total;

    expect(items.find((i: any) => i.id === first.id)).toBeUndefined();
    expect(total).toBe(1);
  });

  it("不存在的草稿回傳 404", async () => {
    const { DELETE: deleteDraft } = await import("@/app/api/inbox/[id]/route");

    const res = await deleteDraft(new Request("http://localhost/api/inbox/id", { method: "DELETE" }), {
      params: { id: "missing-id" }
    });

    expect(res.status).toBe(404);
  });

  it("列表支援分頁與搜尋，超過 100 筆時回傳 hasMore", async () => {
    const { getDb } = await import("@/lib/db");
    const { GET: listDrafts } = await import("@/app/api/inbox/route");

    const db = await getDb();
    db.data!.inbox = Array.from({ length: 120 }).map((_, idx) => ({
      id: `inbox-${idx}`,
      title: `草稿 ${idx}`,
      content: idx === 42 ? "特別搜尋關鍵字" : `內容 ${idx}`,
      hint: idx % 2 === 0 ? "需要整理" : "",
      createdAt: new Date(2024, 0, idx + 1).toISOString(),
      updatedAt: new Date(2024, 0, idx + 1).toISOString()
    }));
    await db.write();

    const firstPageRes = await listDrafts(new Request("http://localhost/api/inbox?limit=50"));
    const firstPayload = await firstPageRes.json();
    expect(firstPayload.items).toHaveLength(50);
    expect(firstPayload.total).toBe(120);
    expect(firstPayload.hasMore).toBe(true);

    const lastPageRes = await listDrafts(new Request("http://localhost/api/inbox?limit=50&offset=100"));
    const lastPayload = await lastPageRes.json();
    expect(lastPayload.items).toHaveLength(20);
    expect(lastPayload.hasMore).toBe(false);

    const searchRes = await listDrafts(new Request("http://localhost/api/inbox?q=特別搜尋關鍵字&limit=50"));
    const searchPayload = await searchRes.json();
    expect(searchPayload.total).toBe(1);
    expect(searchPayload.items[0].content).toContain("特別搜尋關鍵字");
  });
});
