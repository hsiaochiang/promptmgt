import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/projects/:id/readme contract", () => {
  it("GET returns default README content and file metadata", async () => {
    await mkdir(process.env.DEFAULT_ROOT!, { recursive: true });

    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "README 測試專案", status: "進行中" })
      })
    );

    expect(createdRes.status).toBe(201);
    const project = await createdRes.json();

    const { GET } = await import("@/app/api/projects/[id]/readme/route");
    const res = await GET(new Request(`http://localhost/api/projects/${project.id}/readme`), {
      params: { id: project.id }
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(typeof data.content).toBe("string");
    expect(data.content).toContain(`# ${project.name}`);
    expect(typeof data.path).toBe("string");
    expect(typeof data.hash).toBe("string");
    expect(typeof data.mtimeMs).toBe("number");
  });

  it("PUT updates README and enforces conflict on stale expectedHash", async () => {
    await mkdir(process.env.DEFAULT_ROOT!, { recursive: true });

    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "README 衝突專案", status: "進行中" })
      })
    );

    expect(createdRes.status).toBe(201);
    const project = await createdRes.json();

    const { GET, PUT } = await import("@/app/api/projects/[id]/readme/route");

    const readRes = await GET(new Request(`http://localhost/api/projects/${project.id}/readme`), {
      params: { id: project.id }
    });
    expect(readRes.status).toBe(200);
    const read = await readRes.json();

    const putRes = await PUT(
      new Request(`http://localhost/api/projects/${project.id}/readme`, {
        method: "PUT",
        body: JSON.stringify({
          content: "# 更新後\n\n內容",
          expectedHash: read.hash,
          expectedMtime: read.mtimeMs
        })
      }),
      { params: { id: project.id } }
    );

    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(updated.path).toBeTruthy();
    expect(updated.hash).toBeTruthy();
    expect(typeof updated.mtimeMs).toBe("number");
    expect(updated.updatedAt).toBeTruthy();

    const conflictRes = await PUT(
      new Request(`http://localhost/api/projects/${project.id}/readme`, {
        method: "PUT",
        body: JSON.stringify({
          content: "# 本地內容\n\nlocal",
          expectedHash: "stale",
          expectedMtime: updated.mtimeMs
        })
      }),
      { params: { id: project.id } }
    );

    expect(conflictRes.status).toBe(409);
    const err = await conflictRes.json();
    expect(err.code).toBe("conflict");
    expect(err.details?.currentHash).toBeTruthy();
    expect(typeof err.details?.currentMtime).toBe("number");
  });

  it("rejects invalid payload and returns standard error format", async () => {
    const { PUT } = await import("@/app/api/projects/[id]/readme/route");

    const res = await PUT(
      new Request("http://localhost/api/projects/does-not-matter/readme", {
        method: "PUT",
        body: JSON.stringify({})
      }),
      { params: { id: "missing-project" } }
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe("bad_request");
    expect(data.message).toBeTruthy();
  });

  it("returns 404 for unknown project id", async () => {
    const { GET } = await import("@/app/api/projects/[id]/readme/route");

    const res = await GET(new Request("http://localhost/api/projects/missing/readme"), {
      params: { id: "missing" }
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe("not_found");
  });
});
