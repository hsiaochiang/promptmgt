import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import { access } from "fs/promises";
import { join } from "path";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

const isIsoUtc8 = (value?: string | null) => typeof value === "string" && /\+08:00$/.test(value);

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("T074 - 專案 README API", () => {
  it("GET 建立預設 README 並返回路徑/雜湊，PUT 可更新內容與 updatedAt", async () => {
    const { GET, PUT } = await import("@/app/api/projects/[id]/readme/route");
    const { getDb } = await import("@/lib/db");

    const initialRes = await GET(new Request("http://localhost/api/projects/proj-1/readme"), {
      params: { id: "proj-1" }
    });
    expect(initialRes.status).toBe(200);
    const initial = await initialRes.json();
    expect(initial.path).toMatch(/README\.md$/);
    await expect(access(initial.path)).resolves.not.toThrow();

    const initialContent = await fs.readFile(initial.path, "utf8");
    expect(initialContent).toContain("AI 工作流課程");

    const putRes = await PUT(
      new Request("http://localhost/api/projects/proj-1/readme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# 更新後 README\n內容",
          expectedHash: initial.hash,
          expectedMtime: initial.mtimeMs
        })
      }),
      { params: { id: "proj-1" } }
    );
    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(await fs.readFile(initial.path, "utf8")).toContain("更新後 README");

    const db = await getDb();
    const proj = db.data!.projects.find((p) => p.id === "proj-1");
    expect(isIsoUtc8(proj?.updatedAt)).toBe(true);
    expect(updated.updatedAt ? /\+08:00$/.test(updated.updatedAt) : false).toBe(true);

    const rootPath = db.data!.settings.rootPath ?? "";
    expect(initial.path.startsWith(join(rootPath, "AI 工作流課程")) || initial.path.includes("AI 工作流課程")).toBe(true);

    await fs.writeFile(initial.path, "# 外部修改\n內容", "utf8");
    const conflictRes = await PUT(
      new Request("http://localhost/api/projects/proj-1/readme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "# 再次更新",
          expectedHash: updated.hash,
          expectedMtime: updated.mtimeMs
        })
      }),
      { params: { id: "proj-1" } }
    );
    expect([409, 412]).toContain(conflictRes.status);
  });

  it("處理 docPath 重寫、400 缺 content 與 404 專案不存在", async () => {
    const { GET, PUT } = await import("@/app/api/projects/[id]/readme/route");
    const { getDb } = await import("@/lib/db");

    const db = await getDb();
    const project = db.data!.projects.find((p) => p.id === "proj-1");
    const rootPath = db.data!.settings.rootPath ?? "";
    if (project) {
      project.docPath = join(rootPath, "Somewhere", "README.md");
      await db.write();
    }

    const res = await GET(new Request("http://localhost/api/projects/proj-1/readme"), {
      params: { id: "proj-1" }
    });
    expect(res.status).toBe(200);
    const payload = await res.json();
    const reloaded = (await getDb()).data!.projects.find((p) => p.id === "proj-1");
    expect(reloaded?.docPath).toBe(payload.path);

    const badPut = await PUT(
      new Request("http://localhost/api/projects/proj-1/readme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }),
      { params: { id: "proj-1" } }
    );
    expect(badPut.status).toBe(400);

    const missingGet = await GET(new Request("http://localhost/api/projects/missing/readme"), {
      params: { id: "missing" }
    });
    expect(missingGet.status).toBe(404);

    const missingPut = await PUT(
      new Request("http://localhost/api/projects/missing/readme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "NA" })
      }),
      { params: { id: "missing" } }
    );
    expect(missingPut.status).toBe(404);
  });
});
