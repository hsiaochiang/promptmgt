import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
  await mkdir(process.env.DEFAULT_ROOT!, { recursive: true });
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/projects/:id/timeline contract", () => {
  it("GET returns empty array, POST creates item, DELETE removes item", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Timeline 測試專案", status: "進行中" })
      })
    );
    expect(createdRes.status).toBe(201);
    const project = await createdRes.json();

    const { GET, POST, DELETE } = await import("@/app/api/projects/[id]/timeline/route");

    const emptyRes = await GET(new Request(`http://localhost/api/projects/${project.id}/timeline`), {
      params: { id: project.id }
    });
    expect(emptyRes.status).toBe(200);
    const empty = await emptyRes.json();
    expect(Array.isArray(empty)).toBe(true);
    expect(empty.length).toBe(0);

    const createRes = await POST(
      new Request(`http://localhost/api/projects/${project.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: "2025-12-28", label: "關鍵", content: "完成里程碑" })
      }),
      { params: { id: project.id } }
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.id).toBeTruthy();
    expect(created.date).toBe("2025-12-28");
    expect(created.content).toBe("完成里程碑");

    const listRes = await GET(new Request(`http://localhost/api/projects/${project.id}/timeline`), {
      params: { id: project.id }
    });
    const list = await listRes.json();
    expect(list.length).toBe(1);

    const delRes = await DELETE(
      new Request(`http://localhost/api/projects/${project.id}/timeline`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: created.id })
      }),
      { params: { id: project.id } }
    );
    expect(delRes.status).toBe(200);

    const afterRes = await GET(new Request(`http://localhost/api/projects/${project.id}/timeline`), {
      params: { id: project.id }
    });
    const after = await afterRes.json();
    expect(after.length).toBe(0);
  });

  it("validates payload and returns standard errors", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Timeline 驗證專案", status: "進行中" })
      })
    );
    const project = await createdRes.json();

    const { POST, DELETE } = await import("@/app/api/projects/[id]/timeline/route");

    const badPost = await POST(
      new Request(`http://localhost/api/projects/${project.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: "", content: "" })
      }),
      { params: { id: project.id } }
    );
    expect(badPost.status).toBe(400);
    const badData = await badPost.json();
    expect(badData.code).toBe("bad_request");

    const badDelete = await DELETE(
      new Request(`http://localhost/api/projects/${project.id}/timeline`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "" })
      }),
      { params: { id: project.id } }
    );
    expect(badDelete.status).toBe(400);
  });

  it("returns 404 for unknown project id and 400 when rootPath missing", async () => {
    const { GET } = await import("@/app/api/projects/[id]/timeline/route");

    const missing = await GET(new Request("http://localhost/api/projects/missing/timeline"), {
      params: { id: "missing" }
    });
    expect(missing.status).toBe(404);

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.settings.rootPath = "";
    await db.write();

    const badRoot = await GET(new Request("http://localhost/api/projects/any/timeline"), {
      params: { id: "any" }
    });
    expect(badRoot.status).toBe(400);
  });

  it("GET returns [] when _timeline.json is invalid or not an array", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Timeline 讀取異常專案", status: "進行中" })
      })
    );
    const project = await createdRes.json();

    const safeProject = sanitizeFilename(project.name);
    const timelinePath = join(process.env.DEFAULT_ROOT!, safeProject, "_timeline.json");
    await mkdir(join(process.env.DEFAULT_ROOT!, safeProject), { recursive: true });

    const { GET } = await import("@/app/api/projects/[id]/timeline/route");

    await writeFile(timelinePath, "{", "utf8");
    const invalidRes = await GET(new Request("http://localhost/api/projects/x/timeline"), {
      params: { id: project.id }
    });
    expect(invalidRes.status).toBe(200);
    expect(await invalidRes.json()).toEqual([]);

    await writeFile(timelinePath, JSON.stringify({ hello: "world" }), "utf8");
    const notArrayRes = await GET(new Request("http://localhost/api/projects/x/timeline"), {
      params: { id: project.id }
    });
    expect(notArrayRes.status).toBe(200);
    expect(await notArrayRes.json()).toEqual([]);
  });
});
