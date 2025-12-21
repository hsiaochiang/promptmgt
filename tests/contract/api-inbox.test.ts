import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/inbox 合約", () => {
  it("POST 建立並 GET 分頁/hasMore", async () => {
    const { getDb } = await import("@/lib/db");
    const { POST: createDraft, GET: listDrafts } = await import("@/app/api/inbox/route");

    const db = await getDb();
    db.data!.inbox = [];
    await db.write();

    for (let i = 0; i < 60; i++) {
      await createDraft(
        new Request("http://localhost/api/inbox", {
          method: "POST",
          body: JSON.stringify({ title: `草稿 ${i}`, content: `內容 ${i}` })
        })
      );
    }

    const page1 = await listDrafts(new Request("http://localhost/api/inbox?limit=50&offset=0"));
    const payload1 = await page1.json();
    expect(payload1.items).toHaveLength(50);
    expect(payload1.total).toBe(60);
    expect(payload1.hasMore).toBe(true);

    const page2 = await listDrafts(new Request("http://localhost/api/inbox?limit=50&offset=50"));
    const payload2 = await page2.json();
    expect(payload2.items).toHaveLength(10);
    expect(payload2.hasMore).toBe(false);
  });

  it("PATCH 更新內容與 updatedAt，並在版本衝突時回傳 409", async () => {
    const { POST: createDraft } = await import("@/app/api/inbox/route");
    const { PATCH: updateDraft } = await import("@/app/api/inbox/[id]/route");

    const createdRes = await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "初始草稿", content: "初始內容" })
      })
    );
    const created = await createdRes.json();

    const firstPatch = await updateDraft(
      new Request("http://localhost/api/inbox/id", {
        method: "PATCH",
        body: JSON.stringify({ content: "更新一次", hint: "提示" })
      }),
      { params: { id: created.id } }
    );
    const firstData = await firstPatch.json();
    expect(firstPatch.status).toBe(200);
    expect(firstData.content).toBe("更新一次");
    expect(firstData.updatedAt).toBeDefined();

    const conflictRes = await updateDraft(
      new Request("http://localhost/api/inbox/id", {
        method: "PATCH",
        body: JSON.stringify({ content: "舊版本提交", expectedUpdatedAt: created.updatedAt })
      }),
      { params: { id: created.id } }
    );

    expect(conflictRes.status).toBe(409);
    const conflictPayload = await conflictRes.json();
    expect(conflictPayload).toMatchObject({ code: "conflict" });
    expect(conflictPayload.details?.currentUpdatedAt ?? conflictPayload.currentUpdatedAt).toBeDefined();
  });

  it("DELETE 移除草稿，缺少則 404", async () => {
    const { POST: createDraft } = await import("@/app/api/inbox/route");
    const { DELETE: deleteDraft } = await import("@/app/api/inbox/[id]/route");

    const createdRes = await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "刪除我" })
      })
    );
    const created = await createdRes.json();

    const deleteRes = await deleteDraft(new Request("http://localhost/api/inbox/id", { method: "DELETE" }), {
      params: { id: created.id }
    });
    expect(deleteRes.status).toBe(200);

    const missingRes = await deleteDraft(new Request("http://localhost/api/inbox/id", { method: "DELETE" }), {
      params: { id: created.id }
    });
    expect(missingRes.status).toBe(404);
  });
});
