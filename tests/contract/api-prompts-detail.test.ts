import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("/api/prompts detail", () => {
  it("reads prompt detail with frontmatter and allows update", async () => {
    const { POST } = await import("@/app/api/prompts/route");
    const createRes = await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: {
            title: "Detail Prompt",
            project: "Project One",
            type: "其他",
            status: "草稿",
            model: "gpt-4o",
            tags: ["tag1"],
            note: "初始備註",
            updatedAt: "2025-01-01T00:00:00.000Z"
          },
          body: "Content v1"
        })
      })
    );

    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const { GET: detail } = await import("@/app/api/prompts/[id]/route");
    const detailRes = await detail(new Request(`http://localhost/api/prompts/${created.id}`), {
      params: { id: created.id }
    });
    const detailData = await detailRes.json();
    expect(detailData.frontmatter.title).toBe("Detail Prompt");
    expect(detailData.frontmatter.note).toBe("初始備註");
    expect(detailData.body).toContain("Content v1");
    expect(detailData.damaged).toBe(false);

    const updateRes = await detail(
      new Request(`http://localhost/api/prompts/${created.id}`, {
        method: "POST",
        body: JSON.stringify({
          frontmatter: { ...detailData.frontmatter, note: "更新備註" },
          body: "Content v2",
          clientHash: detailData.hash
        })
      }),
      { params: { id: created.id } }
    );

    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.hash).toBeTruthy();
  });

  it("marks damaged prompt when required fields missing", async () => {
    const root = process.env.DEFAULT_ROOT!;
    const projectDir = join(root, "BrokenProj");
    await mkdir(projectDir, { recursive: true });
    const filePath = join(projectDir, "broken.md");
    const raw = "---\nproject: BrokenProj\n---\n\nOnly body";
    await writeFile(filePath, raw, "utf8");
    const id = Buffer.from(filePath, "utf8").toString("base64url");

    const { GET: detail } = await import("@/app/api/prompts/[id]/route");
    const res = await detail(new Request(`http://localhost/api/prompts/${id}`), {
      params: { id }
    });
    const data = await res.json();
    expect(data.damaged).toBe(true);
    expect(data.frontmatter?.project).toBe("BrokenProj");
    expect(data.frontmatter?.title).toBe("untitled");
    expect(data.body.trim()).toBe("Only body");
  });
});
