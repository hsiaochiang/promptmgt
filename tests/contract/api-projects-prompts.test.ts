import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { access } from "fs/promises";
import { join } from "path";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

function encodeId(filePath: string) {
  return Buffer.from(filePath).toString("base64url");
}

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("US2 - Projects & Prompts contract", () => {
  it("creates project, rejects duplicate names, lists with counts", async () => {
    const { GET, POST } = await import("@/app/api/projects/route");

    const createRes = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "新專案", status: "進行中" })
      })
    );

    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.name).toBe("新專案");
    expect(created.promptCount).toBe(0);
    expect(created.id).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
    expect(created.createdAt).toBeTruthy();

    const dupRes = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "新專案", status: "進行中" })
      })
    );
    expect(dupRes.status).toBe(409);

    const listRes = await GET();
    const projects = await listRes.json();
    const found = projects.find((p: any) => p.name === "新專案");
    expect(found).toBeTruthy();
    expect(found.promptCount).toBe(0);
  });

  it("updates project status and deletes project while refreshing counts", async () => {
    const { POST: createProject, DELETE, PATCH, GET } = await import("@/app/api/projects/route");
    const { POST: createPrompt } = await import("@/app/api/prompts/route");

    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "待刪除專案", status: "規劃中" })
      })
    );
    const created = await createdRes.json();

    const updateRes = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: created.id, status: "進行中", name: "更新後專案" })
      })
    );
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.status).toBe("進行中");
    expect(updated.name).toBe("更新後專案");

    const promptRes = await createPrompt(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: {
            title: "待刪除提示詞",
            project: "更新後專案",
            type: "其他",
            status: "使用中",
            model: "gpt-4o-mini",
            tags: [],
            updatedAt: new Date().toISOString()
          },
          body: "content"
        })
      })
    );
    expect(promptRes.status).toBe(201);

    const anotherPrompt = await createPrompt(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: {
            title: "保留提示詞",
            project: "AI 工作流課程",
            type: "其他",
            status: "使用中",
            model: "gpt-4o-mini",
            tags: [],
            updatedAt: new Date().toISOString()
          },
          body: "keep"
        })
      })
    );
    expect(anotherPrompt.status).toBe(201);

    const deleteRes = await DELETE(
      new Request("http://localhost/api/projects", {
        method: "DELETE",
        body: JSON.stringify({ id: created.id })
      })
    );
    expect(deleteRes.status).toBe(200);

    const listRes = await GET();
    const projects = await listRes.json();
    expect(projects.find((p: any) => p.id === created.id)).toBeUndefined();
    const remaining = projects.find((p: any) => p.name === "AI 工作流課程");
    expect(remaining.promptCount).toBeGreaterThanOrEqual(1);
  });

  it("creates prompts, filters by project/status, and sorts by updatedAt desc", async () => {
    const { POST, GET } = await import("@/app/api/prompts/route");

    const now = Date.now();
    const fmBase = {
      project: "篩選專案",
      type: "其他",
      model: "gpt-4o-mini",
      tags: [] as string[],
      status: "使用中"
    };

    const newer = {
      ...fmBase,
      title: "較新",
      updatedAt: new Date(now).toISOString()
    };
    const older = {
      ...fmBase,
      title: "較舊",
      status: "草稿",
      updatedAt: new Date(now - 1000).toISOString()
    };

    const otherProject = {
      ...fmBase,
      project: "其他專案",
      title: "不同專案",
      updatedAt: new Date(now - 2000).toISOString()
    };

    await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({ frontmatter: newer, body: "new" })
      })
    );
    await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({ frontmatter: older, body: "old" })
      })
    );
    await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({ frontmatter: otherProject, body: "other" })
      })
    );

    const listRes = await GET(new Request("http://localhost/api/prompts?projectId=" + encodeURIComponent("篩選專案") + "&status=" + encodeURIComponent("使用中")));
    const prompts = await listRes.json();
    expect(prompts.length).toBe(1);
    expect(prompts[0].title).toBe("較新");
  });

  it("reads prompt detail and enforces conflict on stale hash", async () => {
    const { POST, GET } = await import("@/app/api/prompts/route");
    const { POST: savePrompt } = await import("@/app/api/prompts/[id]/route");

    const fm = {
      title: "衝突測試",
      project: "衝突專案",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: new Date().toISOString()
    };

    const createRes = await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({ frontmatter: fm, body: "initial" })
      })
    );
    const created = await createRes.json();

    const detailRes = await import("@/app/api/prompts/[id]/route");
    const readRes = await detailRes.GET(new Request("http://localhost/api/prompts/" + created.id), {
      params: { id: created.id }
    });
    expect(readRes.status).toBe(200);
    const detail = await readRes.json();
    expect(detail.frontmatter.title).toBe("衝突測試");
    expect(detail.hash).toBeTruthy();

    const staleSave = await savePrompt(
      new Request("http://localhost/api/prompts/" + created.id, {
        method: "POST",
        body: JSON.stringify({ frontmatter: fm, body: "local", clientHash: "stale" })
      }),
      { params: { id: created.id } }
    );
    expect(staleSave.status).toBe(409);

    const okSave = await savePrompt(
      new Request("http://localhost/api/prompts/" + created.id, {
        method: "POST",
        body: JSON.stringify({ frontmatter: { ...fm, updatedAt: new Date().toISOString() }, body: "updated", clientHash: detail.hash })
      }),
      { params: { id: created.id } }
    );
    expect(okSave.status).toBe(200);
  });

  it("deletes prompt and refreshes project counts", async () => {
    const { POST, GET } = await import("@/app/api/prompts/route");
    const detailRoute = await import("@/app/api/prompts/[id]/route");
    const { GET: listProjects } = await import("@/app/api/projects/route");

    const fm = {
      title: "刪除提示詞",
      project: "刪除專案",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: new Date().toISOString()
    };

    const createRes = await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({ frontmatter: fm, body: "to delete" })
      })
    );
    const created = await createRes.json();
    const decodedPath = Buffer.from(created.id, "base64url").toString("utf8");

    const delRes = await detailRoute.DELETE(new Request("http://localhost/api/prompts/" + created.id), {
      params: { id: created.id }
    });
    expect(delRes.status).toBe(200);
    await expect(access(decodedPath)).rejects.toThrow();

    const projectsRes = await listProjects();
    const projects = await projectsRes.json();
    const project = projects.find((p: any) => p.name === "刪除專案");
    expect(project?.promptCount ?? 0).toBe(0);
  });
});
