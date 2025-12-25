import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import { toIsoWithOffset } from "@/lib/utils/date";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) {
    await restoreWorkspace();
  }
});

describe("Phase F - Workspace flows", () => {
  it("T150 新增草稿後可自動儲存並保持最新內容", async () => {
    const { POST: createDraft } = await import("@/app/api/inbox/route");
    const { PATCH: updateDraft, GET: getDraft } = await import("@/app/api/inbox/[id]/route");

    const createRes = await createDraft(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "Auto 草稿", content: "初始內容" })
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const patchRes = await updateDraft(
      new Request("http://localhost/api/inbox", {
        method: "PATCH",
        body: JSON.stringify({
          title: "Auto 草稿",
          content: "更新後內容",
          hint: "提醒",
          expectedUpdatedAt: created.updatedAt
        })
      }),
      { params: { id: created.id } }
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.content).toBe("更新後內容");
    expect(patched.updatedAt).not.toBe(created.updatedAt);

    const reopenedRes = await getDraft(new Request(`http://localhost/api/inbox/${created.id}`), {
      params: { id: created.id }
    });
    const reopened = await reopenedRes.json();
    expect(reopened.title).toBe("Auto 草稿");
    expect(reopened.content).toBe("更新後內容");
    expect(reopened.updatedAt).toBe(patched.updatedAt);
  });

  it("T151 新增專案後可選取並刷新提示詞列表", async () => {
    const { POST: createProject, GET: listProjects } = await import("@/app/api/projects/route");
    const { GET: listPrompts } = await import("@/app/api/prompts/route");

    const createRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "整合測試專案", status: "進行中", description: "建立後應可選取" })
      })
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.name).toBe("整合測試專案");

    const projectsRes = await listProjects();
    const projects = await projectsRes.json();
    const found = projects.find((p: any) => p.name === "整合測試專案");
    expect(found).toBeTruthy();

    const promptsRes = await listPrompts(
      new Request(`http://localhost/api/prompts?projectId=${encodeURIComponent(created.name)}`)
    );
    const prompts = await promptsRes.json();
    expect(Array.isArray(prompts)).toBe(true);
    expect(prompts.length).toBe(0);
  });

  it("T152 草稿轉正後出現在提示詞列表並自收件匣移除", async () => {
    const { archiveDraft } = await import("@/app/(workspace)/actions/archiveDraft");
    const { GET: listPrompts } = await import("@/app/api/prompts/route");
    const { GET: listInbox } = await import("@/app/api/inbox/route");
    const { getDb } = await import("@/lib/db");

    const db = await getDb();
    const draft = db.data!.inbox[0];
    const project = db.data!.projects[0];
    const title = "轉正整合測試草稿";
    const now = toIsoWithOffset();

    await archiveDraft({
      draftId: draft.id,
      projectName: project.name,
      frontmatter: {
        title,
        project: project.name,
        type: "其他",
        status: "使用中",
        model: "gpt-4o-mini",
        tags: ["integration"],
        note: "由整合測試產生",
        updatedAt: now,
        createdAt: draft.createdAt ?? now
      },
      body: "轉正後的內容"
    });

    const inboxRes = await listInbox(new Request("http://localhost/api/inbox"));
    const inboxPayload = await inboxRes.json();
    const inboxItems = Array.isArray(inboxPayload.items) ? inboxPayload.items : inboxPayload;
    expect(inboxItems.some((item: any) => item.id === draft.id)).toBe(false);

    const promptsRes = await listPrompts(
      new Request(`http://localhost/api/prompts?projectId=${encodeURIComponent(project.name)}`)
    );
    const prompts = await promptsRes.json();
    expect(prompts.some((p: any) => p.title === title)).toBe(true);
  });

  it("T153 專案名稱缺失時回傳驗證錯誤", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");

    const res = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: " " })
      })
    );
    expect(res.status).toBe(400);
    const payload = await res.json();
    expect((payload as any).message).toMatch(/name is required/i);
  });
});
