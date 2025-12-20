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

describe("API contracts", () => {
  it("projects route returns schema-compliant payloads", async () => {
    const { GET, POST } = await import("@/app/api/projects/route");

    const listResponse = await GET();
    const projects = await listResponse.json();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      status: expect.any(String),
      promptCount: expect.any(Number)
    });

    const createResponse = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "新專案" })
      })
    );
    const created = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(created).toMatchObject({
      name: "新專案",
      status: "規劃中",
      promptCount: 0,
      id: expect.any(String)
    });
  });

  it("projects PATCH updates status and counts", async () => {
    const { GET, PATCH } = await import("@/app/api/projects/route");
    const listResponse = await GET();
    const [first] = await listResponse.json();

    const patchResponse = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: first.id, status: "已結案", promptCount: 99 })
      })
    );
    const updated = await patchResponse.json();
    expect(updated.status).toBe("已結案");
    expect(updated.promptCount).toBe(99);
  });

  it("projects PATCH validates id and existence", async () => {
    const { PATCH } = await import("@/app/api/projects/route");

    const missingIdRes = await PATCH(
      new Request("http://localhost/api/projects", { method: "PATCH", body: JSON.stringify({}) })
    );
    expect(missingIdRes.status).toBe(400);

    const notFoundRes = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: "proj-missing", name: "none" })
      })
    );
    expect(notFoundRes.status).toBe(404);
  });

  it("inbox routes return and create drafts with required fields", async () => {
    const { GET, POST } = await import("@/app/api/inbox/route");

    const response = await GET();
    const drafts = await response.json();
    expect(drafts[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      content: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });

    const createResponse = await POST(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "測試草稿", content: "內容" })
      })
    );
    const created = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(created.id).toContain("inbox-");
    expect(created).toMatchObject({
      title: "測試草稿",
      content: "內容",
      hint: "",
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
  });

  it("inbox detail routes allow read/update/delete", async () => {
    const { POST: create } = await import("@/app/api/inbox/route");
    const { GET, PATCH, DELETE } = await import("@/app/api/inbox/[id]/route");

    const createdRes = await create(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "detail draft" })
      })
    );
    const draft = await createdRes.json();

    const detailRes = await GET(new Request("http://localhost/api/inbox/id"), {
      params: { id: draft.id }
    });
    const detail = await detailRes.json();
    expect(detail.id).toBe(draft.id);

    const missingRes = await GET(new Request("http://localhost/api/inbox/id"), {
      params: { id: "missing" }
    });
    expect(missingRes.status).toBe(404);

    const patchedRes = await PATCH(
      new Request("http://localhost/api/inbox/id", {
        method: "PATCH",
        body: JSON.stringify({ content: "updated" })
      }),
      { params: { id: draft.id } }
    );
    const patched = await patchedRes.json();
    expect(patched.content).toBe("updated");

    const deleteRes = await DELETE(new Request("http://localhost/api/inbox/id"), {
      params: { id: draft.id }
    });
    const deleted = await deleteRes.json();
    expect(deleted).toEqual({ ok: true });
  });

  it("prompts list endpoint emits frontmatter fields", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/prompts/route");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });
    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "Sample Prompt",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["tag-a"],
        updatedAt: new Date().toISOString()
      },
      "Prompt body"
    );

    const response = await GET(new Request("http://localhost/api/prompts?projectId=proj-1"));
    const prompts = await response.json();
    expect(prompts.length).toBe(1);
    expect(prompts[0]).toMatchObject({
      id: expect.any(String),
      projectId: "proj-1",
      title: "Sample Prompt",
      type: "結構設計",
      status: "使用中",
      model: "gpt-4",
      tags: ["tag-a"],
      updatedAt: expect.any(String)
    });
  });

  it("prompts list returns empty when rootPath is unset", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/prompts/route");

    await updateSettings({ rootPath: null });
    const response = await GET(new Request("http://localhost/api/prompts"));
    const prompts = await response.json();
    expect(prompts).toEqual([]);
  });

  it("prompt detail route returns and saves content with conflict checks", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET, POST } = await import("@/app/api/prompts/[id]/route");
    const { computeHash } = await import("@/lib/services/conflict");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });
    const filePath = await writePrompt(
      rootPath,
      "AI 工作流課程",
      {
        title: "Detail Test",
        project: "AI 工作流課程",
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["detail"],
        updatedAt: new Date().toISOString()
      },
      "Original body"
    );

    const id = Buffer.from(filePath, "utf8").toString("base64url");
    const detailRes = await GET(new Request("http://localhost/api/prompts/id"), {
      params: { id }
    });
    const detail = await detailRes.json();

    const saveRes = await POST(
      new Request("http://localhost/api/prompts/id", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: { ...detail.frontmatter, model: "gpt-4o" },
          body: "Updated body",
          clientHash: detail.hash ?? computeHash("Original body")
        })
      }),
      { params: { id } }
    );
    const saved = await saveRes.json();
    expect(saved.hash).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it("prompt detail route surfaces conflicts", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { POST } = await import("@/app/api/prompts/[id]/route");
    const { computeHash } = await import("@/lib/services/conflict");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });
    const filePath = await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "Conflict Test",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["conflict"],
        updatedAt: new Date().toISOString()
      },
      "Conflict body"
    );

    const id = Buffer.from(filePath, "utf8").toString("base64url");
    const conflictRes = await POST(
      new Request("http://localhost/api/prompts/id", {
        method: "POST",
        body: JSON.stringify({
          frontmatter: {
            title: "Conflict Test",
            project: "proj-1",
            type: "結構設計",
            status: "使用中",
            model: "gpt-4",
            tags: ["conflict"],
            updatedAt: new Date().toISOString()
          },
          body: "Changed",
          clientHash: computeHash("mismatch")
        })
      }),
      { params: { id } }
    );
    expect(conflictRes.status).toBe(409);
  });

  it("settings route returns persisted toggles and rootPath", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/settings/route");

    await updateSettings({ telemetryEnabled: false, updateCheckEnabled: true });
    const response = await GET();
    const settings = await response.json();
    expect(settings).toMatchObject({
      rootPath: expect.any(String),
      telemetryEnabled: false,
      updateCheckEnabled: true
    });
  });

  it("settings POST updates toggles", async () => {
    const { POST } = await import("@/app/api/settings/route");
    const response = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ telemetryEnabled: true, rootPath: process.env.DEFAULT_ROOT })
      })
    );
    const updated = await response.json();
    expect(updated.telemetryEnabled).toBe(true);
  });

  it("search endpoint returns capped results with snippets", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/search/route");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });
    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "Highly Searchable Prompt",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["search"],
        updatedAt: new Date().toISOString()
      },
      "search body"
    );

    const response = await GET(new Request("http://localhost/api/search?q=search"));
    const results = await response.json();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      id: expect.any(String),
      snippet: expect.any(String),
      title: expect.stringContaining("Searchable")
    });
  });

  it("search endpoint handles missing query parameter", async () => {
    const { GET } = await import("@/app/api/search/route");
    const response = await GET(new Request("http://localhost/api/search"));
    const results = await response.json();
    expect(Array.isArray(results)).toBe(true);
  });

  it("search endpoint returns empty when rootPath missing", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/search/route");

    await updateSettings({ rootPath: null });
    const response = await GET(new Request("http://localhost/api/search?q=anything"));
    const results = await response.json();
    expect(results).toEqual([]);
  });

  it("snippets endpoints expose usage info", async () => {
    const { GET: listSnippets } = await import("@/app/api/snippets/route");
    const { POST: incrementUsage } = await import("@/app/api/snippets/[id]/usage/route");

    const listResponse = await listSnippets();
    const snippets = await listResponse.json();
    expect(snippets[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      category: expect.any(String),
      content: expect.any(String),
      usage: expect.any(Number)
    });

    const usageResponse = await incrementUsage(new Request("http://localhost"), {
      params: { id: snippets[0].id }
    });
    const updated = await usageResponse.json();
    expect(updated.usage).toBe(snippets[0].usage + 1);
    expect(updated.lastUsedAt).toBeDefined();
  });

  it("snippets usage endpoint returns 404 for missing snippet", async () => {
    const { POST: incrementUsage } = await import("@/app/api/snippets/[id]/usage/route");
    const response = await incrementUsage(new Request("http://localhost"), { params: { id: "missing" } });
    expect(response.status).toBe(404);
  });
});
