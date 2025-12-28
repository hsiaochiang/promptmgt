import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
  await mkdir(process.env.DEFAULT_ROOT!, { recursive: true });
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/projects/:id/files contract", () => {
  it(
    "GET lists, POST uploads (dedupe), GET downloads, DELETE removes",
    async () => {
    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Files 測試專案", status: "進行中" })
      })
    );
    expect(createdRes.status).toBe(201);
    const project = await createdRes.json();

    const listModule = await import("@/app/api/projects/[id]/files/route");
    const itemModule = await import("@/app/api/projects/[id]/files/[name]/route");

    const emptyRes = await listModule.GET(new Request(`http://localhost/api/projects/${project.id}/files`), {
      params: { id: project.id }
    });
    expect(emptyRes.status).toBe(200);
    const empty = await emptyRes.json();
    expect(Array.isArray(empty)).toBe(true);

    const form1 = new FormData();
    form1.append("file", new File(["hello"], "note.md", { type: "text/markdown" }));
    const upload1 = await listModule.POST(
      ({ formData: async () => form1 } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(upload1.status).toBe(201);
    const f1 = await upload1.json();
    expect(f1.name).toBeTruthy();
    expect(f1.size).toBeGreaterThan(0);

    // upload same name again should dedupe
    const form2 = new FormData();
    form2.append("file", new File(["hello2"], "note.md", { type: "text/markdown" }));
    const upload2 = await listModule.POST(
      ({ formData: async () => form2 } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(upload2.status).toBe(201);
    const f2 = await upload2.json();
    expect(f2.name).toBeTruthy();
    expect(f2.name).not.toBe(f1.name);

    const listRes = await listModule.GET(new Request(`http://localhost/api/projects/${project.id}/files`), {
      params: { id: project.id }
    });
    const list = await listRes.json();
    expect(list.length).toBe(2);

    const download = await itemModule.GET(new Request(`http://localhost/api/projects/${project.id}/files/${encodeURIComponent(f1.name)}`), {
      params: { id: project.id, name: f1.name }
    });
    expect(download.status).toBe(200);
    const disp = download.headers.get("content-disposition") ?? "";
    expect(disp.toLowerCase()).toContain("attachment");

    const del = await itemModule.DELETE(new Request(`http://localhost/api/projects/${project.id}/files/${encodeURIComponent(f1.name)}`), {
      params: { id: project.id, name: f1.name }
    });
    expect(del.status).toBe(200);

    const afterListRes = await listModule.GET(new Request(`http://localhost/api/projects/${project.id}/files`), {
      params: { id: project.id }
    });
    const afterList = await afterListRes.json();
    expect(afterList.length).toBe(1);
    },
    10000
  );

  it("validates errors: 404 project, 400 missing file, 404 missing file", async () => {
    const listModule = await import("@/app/api/projects/[id]/files/route");
    const itemModule = await import("@/app/api/projects/[id]/files/[name]/route");

    const missingProject = await listModule.GET(new Request("http://localhost/api/projects/missing/files"), {
      params: { id: "missing" }
    });
    expect(missingProject.status).toBe(404);

    const { POST: createProject } = await import("@/app/api/projects/route");
    const createdRes = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Files 驗證專案", status: "進行中" })
      })
    );
    const project = await createdRes.json();

    // invalid form data
    const invalidForm = await listModule.POST(
      ({
        formData: async () => {
          throw new Error("bad form");
        }
      } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(invalidForm.status).toBe(400);

    // accepts file-like object with arrayBuffer()
    const uploadLike = await listModule.POST(
      ({
        formData: async () =>
          ({
            get: (key: string) =>
              key === "file"
                ? {
                    name: "blob.bin",
                    arrayBuffer: async () => new TextEncoder().encode("bin").buffer
                  }
                : null
          } as any)
      } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(uploadLike.status).toBe(201);

    const badForm = new FormData();
    const badUpload = await listModule.POST(
      ({ formData: async () => badForm } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(badUpload.status).toBe(400);

    // invalid file payload (arrayBuffer throws)
    const badFilePayload = await listModule.POST(
      ({
        formData: async () =>
          ({
            get: (key: string) =>
              key === "file"
                ? {
                    name: "bad.bin",
                    arrayBuffer: async () => {
                      throw new Error("broken");
                    }
                  }
                : null
          } as any)
      } as unknown as Request),
      { params: { id: project.id } }
    );
    expect(badFilePayload.status).toBe(400);

    const missingFile = await itemModule.GET(new Request("http://localhost/api/projects/x/files/"), {
      params: { id: project.id, name: "" }
    });
    expect(missingFile.status).toBe(400);

    const notFoundFile = await itemModule.GET(new Request("http://localhost/api/projects/x/files/nope.txt"), {
      params: { id: project.id, name: "nope.txt" }
    });
    expect(notFoundFile.status).toBe(404);

    // item route: 404 project
    const missingProjectItem = await itemModule.GET(new Request("http://localhost/api/projects/missing/files/any.txt"), {
      params: { id: "missing", name: "any.txt" }
    });
    expect(missingProjectItem.status).toBe(404);

    // item route: safeSegment without extension + directory with same name is not a file
    const { getDb } = await import("@/lib/db");
    const { sanitizeFilename } = await import("@/lib/utils/sanitizeFilename");
    const { join } = await import("path");
    const { promises: fs } = await import("fs");

    const db = await getDb();
    const rootPath = db.data!.settings.rootPath!;
    const safeProject = sanitizeFilename(project.name);
    const filesDir = join(rootPath, safeProject, "_files");
    await fs.mkdir(filesDir, { recursive: true });
    await fs.writeFile(join(filesDir, "plain"), "hi", "utf8");
    await fs.mkdir(join(filesDir, "folder.md"), { recursive: true });

    const noExtDownload = await itemModule.GET(new Request("http://localhost/api/projects/x/files/plain"), {
      params: { id: project.id, name: "plain" }
    });
    expect(noExtDownload.status).toBe(200);

    const dirAsFile = await itemModule.GET(new Request("http://localhost/api/projects/x/files/folder.md"), {
      params: { id: project.id, name: "folder.md" }
    });
    expect(dirAsFile.status).toBe(404);
  });

  it("returns 400 when rootPath is not configured", async () => {
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.settings.rootPath = "";
    await db.write();

    const listModule = await import("@/app/api/projects/[id]/files/route");
    const res = await listModule.GET(new Request("http://localhost/api/projects/any/files"), {
      params: { id: "any" }
    });
    expect(res.status).toBe(400);

    const itemModule = await import("@/app/api/projects/[id]/files/[name]/route");
    const itemRes = await itemModule.GET(new Request("http://localhost/api/projects/any/files/a.txt"), {
      params: { id: "any", name: "a.txt" }
    });
    expect(itemRes.status).toBe(400);
  });
});
