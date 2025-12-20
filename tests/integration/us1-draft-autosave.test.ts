import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("US1 - 收件匣草稿自動儲存", () => {
  it("PATCH 後重新載入仍保留最後內容與時間戳", async () => {
    const { POST: createDraft } = await import("@/app/api/inbox/route");
    const { PATCH: autosave } = await import("@/app/api/inbox/[id]/route");

    const createdRes = await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "初始草稿", content: "初始內容" })
      })
    );
    const created = await createdRes.json();

    const autosaveRes = await autosave(
      new Request("http://localhost/api/inbox/id", {
        method: "PATCH",
        body: JSON.stringify({ content: "更新後內容", hint: "提示" })
      }),
      { params: { id: created.id } }
    );
    const updated = await autosaveRes.json();

    expect(updated.content).toBe("更新後內容");
    expect(updated.updatedAt).toBeDefined();

    vi.resetModules();
    const { GET: reopenDraft } = await import("@/app/api/inbox/[id]/route");
    const reopenRes = await reopenDraft(new Request("http://localhost/api/inbox/id"), {
      params: { id: created.id }
    });
    const reopened = await reopenRes.json();

    expect(reopened.content).toBe("更新後內容");
    expect(new Date(reopened.updatedAt).getTime()).toBe(
      new Date(updated.updatedAt).getTime()
    );
  });
});
