import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, readFile, writeFile } from "fs/promises";
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

describe("/api/projects/:id/meta contract", () => {
  it("GET returns empty object initially, PUT persists to _meta.json", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Meta 測試專案", status: "進行中" })
      })
    );
    expect(createdRes.status).toBe(201);
    const project = await createdRes.json();

    const { GET, PUT } = await import("@/app/api/projects/[id]/meta/route");

    const emptyRes = await GET(new Request(`http://localhost/api/projects/${project.id}/meta`), {
      params: { id: project.id }
    });
    expect(emptyRes.status).toBe(200);
    const empty = await emptyRes.json();
    expect(empty && typeof empty === "object").toBe(true);

    const putRes = await PUT(
      new Request(`http://localhost/api/projects/${project.id}/meta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "INTERNAL_PRODUCT",
          stage: "進行中",
          platforms: ["CHATGPT", "CODEX"],
          deliverables: ["MD"],
          audiences: ["INTERNAL"],
          commonTags: ["REUSABLE", "DECISION"]
        })
      }),
      { params: { id: project.id } }
    );

    expect(putRes.status).toBe(200);
    const saved = await putRes.json();
    expect(saved.category).toBe("INTERNAL_PRODUCT");
    expect(saved.platforms).toEqual(["CHATGPT", "CODEX"]);
    expect(saved.updatedAt).toBeTruthy();

    const safeProject = sanitizeFilename(project.name);
    const metaPath = join(process.env.DEFAULT_ROOT!, safeProject, "_meta.json");
    const raw = await readFile(metaPath, "utf8");
    expect(raw).toContain("INTERNAL_PRODUCT");
  });

  it("returns 404 for unknown project id", async () => {
    const { GET } = await import("@/app/api/projects/[id]/meta/route");

    const res = await GET(new Request("http://localhost/api/projects/missing/meta"), {
      params: { id: "missing" }
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe("not_found");
  });

  it("returns 400 when rootPath is not configured", async () => {
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.settings.rootPath = "";
    await db.write();

    const { GET } = await import("@/app/api/projects/[id]/meta/route");
    const res = await GET(new Request("http://localhost/api/projects/does-not-matter/meta"), {
      params: { id: "any" }
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("bad_request");
  });

  it("PUT rejects invalid payload", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Meta 驗證專案", status: "進行中" })
      })
    );
    const project = await createdRes.json();

    const { PUT } = await import("@/app/api/projects/[id]/meta/route");
    const res = await PUT(
      new Request(`http://localhost/api/projects/${project.id}/meta`, {
        method: "PUT",
        // invalid JSON
        body: "{"
      }),
      { params: { id: project.id } }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("bad_request");
  });

  it("GET tolerates invalid or non-object _meta.json", async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Meta 讀取異常專案", status: "進行中" })
      })
    );
    const project = await createdRes.json();

    const safeProject = sanitizeFilename(project.name);
    const metaPath = join(process.env.DEFAULT_ROOT!, safeProject, "_meta.json");
    await mkdir(join(process.env.DEFAULT_ROOT!, safeProject), { recursive: true });

    const { GET } = await import("@/app/api/projects/[id]/meta/route");

    await writeFile(metaPath, "{", "utf8");
    const invalidJsonRes = await GET(new Request("http://localhost/api/projects/x/meta"), {
      params: { id: project.id }
    });
    expect(invalidJsonRes.status).toBe(200);
    expect(await invalidJsonRes.json()).toEqual({});

    await writeFile(metaPath, JSON.stringify("just-a-string"), "utf8");
    const primitiveRes = await GET(new Request("http://localhost/api/projects/x/meta"), {
      params: { id: project.id }
    });
    expect(primitiveRes.status).toBe(200);
    expect(await primitiveRes.json()).toEqual({});
  });
});
