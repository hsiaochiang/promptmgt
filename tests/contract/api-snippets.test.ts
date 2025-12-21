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

describe("API /api/snippets", () => {
  it("lists snippets and supports search query", async () => {
    const { GET } = await import("@/app/api/snippets/route");

    const listRes = await GET(new Request("http://localhost/api/snippets"));
    const all = await listRes.json();
    expect(Array.isArray(all)).toBe(true);
    expect(all[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      usageCount: expect.any(Number)
    });

    const searchRes = await GET(new Request("http://localhost/api/snippets?q=markdown"));
    const filtered = await searchRes.json();
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((snippet: any) => {
      const haystack = `${snippet.name}${snippet.content}${snippet.category}`.toLowerCase();
      expect(haystack).toContain("markdown");
    });
  });

  it("creates, prevents duplicates, updates and deletes", async () => {
    const { GET, POST } = await import("@/app/api/snippets/route");
    const { GET: GET_ID, PATCH, DELETE } = await import("../../app/api/snippets/[id]/route");

    const createRes = await POST(
      new Request("http://localhost/api/snippets", {
        method: "POST",
        body: JSON.stringify({ name: "新的片語", category: "測試", content: "hello" })
      })
    );
    const created = await createRes.json();
    expect(createRes.status).toBe(201);
    expect(created).toMatchObject({ name: "新的片語", category: "測試", usageCount: 0 });

    const conflictRes = await POST(
      new Request("http://localhost/api/snippets", {
        method: "POST",
        body: JSON.stringify({ name: "新的片語" })
      })
    );
    expect(conflictRes.status).toBe(409);

    const detailRes = await GET_ID(new Request("http://localhost/api/snippets/id"), { params: { id: created.id } });
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.id).toBe(created.id);

    const patchRes = await PATCH(
      new Request("http://localhost/api/snippets/id", {
        method: "PATCH",
        body: JSON.stringify({ name: "更新後名稱", category: "調整後" })
      }),
      { params: { id: created.id } }
    );
    const patched = await patchRes.json();
    expect(patched.name).toBe("更新後名稱");
    expect(patched.category).toBe("調整後");

    const emptyNameRes = await PATCH(
      new Request("http://localhost/api/snippets/id", {
        method: "PATCH",
        body: JSON.stringify({ name: "" })
      }),
      { params: { id: created.id } }
    );
    expect(emptyNameRes.status).toBe(400);

    const deleteRes = await DELETE(new Request("http://localhost/api/snippets/id", { method: "DELETE" }), {
      params: { id: created.id }
    });
    expect(deleteRes.status).toBe(200);

      const missingDetail = await GET_ID(new Request("http://localhost/api/snippets/id"), {
        params: { id: created.id }
      });
      expect(missingDetail.status).toBe(404);

      const missingPatch = await PATCH(
        new Request("http://localhost/api/snippets/id", { method: "PATCH", body: JSON.stringify({ name: "" }) }),
        { params: { id: "snip-missing" } }
      );
      expect(missingPatch.status).toBe(404);

    const listRes = await GET(new Request("http://localhost/api/snippets"));
    const list = await listRes.json();
    expect(list.find((s: any) => s.id === created.id)).toBeUndefined();
  });

  it("increments usage count and timestamps", async () => {
    const { POST: create } = await import("@/app/api/snippets/route");
    const { POST: increment } = await import("../../app/api/snippets/[id]/usage/route");
    const { GET: GET_ID } = await import("../../app/api/snippets/[id]/route");

    const createdRes = await create(
      new Request("http://localhost/api/snippets", {
        method: "POST",
        body: JSON.stringify({ name: "使用次數測試", content: "body" })
      })
    );
    const created = await createdRes.json();

    const first = await increment(new Request(`http://localhost/api/snippets/${created.id}/usage`, { method: "POST" }), {
      params: { id: created.id }
    });
    const firstPayload = await first.json();
    expect(first.status).toBe(200);
    expect(firstPayload.usageCount ?? firstPayload.usage).toBe(1);
    expect(firstPayload.lastUsedAt).toBeDefined();

    await increment(new Request(`http://localhost/api/snippets/${created.id}/usage`, { method: "POST" }), {
      params: { id: created.id }
    });

    const detailRes = await GET_ID(new Request("http://localhost/api/snippets/id"), { params: { id: created.id } });
    const detail = await detailRes.json();
    expect(detail.usageCount ?? detail.usage).toBe(2);
    expect(detail.lastUsedAt).toBeDefined();
  });
});
