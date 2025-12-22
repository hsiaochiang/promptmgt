import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { join } from "path";
import { mkdir } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
  vi.resetAllMocks();
  vi.resetModules();
});

describe("/api/settings/change-report", () => {
  it("returns empty array when no recent changes", async () => {
    const { GET } = await import("@/app/api/settings/change-report/route");
    const res = await GET(new Request("http://localhost/api/settings/change-report"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("returns prompt and inbox changes within 24h", async () => {
    const rootPath = process.env.DEFAULT_ROOT!;
    const projectDir = join(rootPath, "Alpha");
    await mkdir(projectDir, { recursive: true });

    const now = new Date().toISOString();

    const { writePrompt } = await import("@/lib/fs/prompts");
    await writePrompt(rootPath, "Alpha", {
      title: "Prompt A",
      project: "Alpha",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: now,
      createdAt: now
    }, "內容");

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox.push({
      id: "inbox-123",
      title: "Draft A",
      content: "",
      hint: "",
      createdAt: now,
      updatedAt: now
    });
    await db.write();

    const { GET } = await import("@/app/api/settings/change-report/route");
    const res = await GET(new Request("http://localhost/api/settings/change-report"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as Array<{ title: string; action: string; kind: string }>;
    const titles = data.map((d) => d.title);
    expect(titles).toContain("Prompt A");
    expect(titles).toContain("Draft A");
    const actions = data.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.action] = (acc[curr.action] ?? 0) + 1;
      return acc;
    }, {});
    expect(actions["新增提示詞"]).toBe(1);
    expect(actions["新增草稿"]).toBe(1);
  });

  it("skips stale items and marks updates", async () => {
    const rootPath = process.env.DEFAULT_ROOT!;
    const projectDir = join(rootPath, "Beta");
    await mkdir(projectDir, { recursive: true });

    const now = Date.now();
    const recent = new Date(now - 6 * 60 * 60 * 1000).toISOString();
    const old = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { writePrompt } = await import("@/lib/fs/prompts");
    await writePrompt(rootPath, "Beta", {
      title: "Prompt Recent Update",
      project: "Beta",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: recent,
      createdAt: old
    }, "內容");

    await writePrompt(rootPath, "Beta", {
      title: "Prompt Too Old",
      project: "Beta",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: old,
      createdAt: old
    }, "內容");

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox.push(
      {
        id: "inbox-recent",
        title: "",
        content: "",
        hint: "",
        createdAt: old,
        updatedAt: recent
      },
      {
        id: "inbox-old",
        title: "Old Draft",
        content: "",
        hint: "",
        createdAt: old,
        updatedAt: old
      }
    );
    await db.write();

    const { GET } = await import("@/app/api/settings/change-report/route");
    const res = await GET(new Request("http://localhost/api/settings/change-report"));
    expect(res.status).toBe(200);
    const data = await res.json();
    const titles = data.map((item: any) => item.title);
    expect(titles).toContain("Prompt Recent Update");
    expect(titles).toContain("未命名草稿");
    expect(titles).not.toContain("Prompt Too Old");
    expect(titles).not.toContain("Old Draft");

    const actions = data.reduce<Record<string, number>>((acc: Record<string, number>, curr: any) => {
      acc[curr.action] = (acc[curr.action] ?? 0) + 1;
      return acc;
    }, {});
    expect(actions["更新提示詞"]).toBe(1);
    expect(actions["更新草稿"]).toBe(1);
  });

  it("ignores invalid timestamps instead of throwing", async () => {
    const rootPath = process.env.DEFAULT_ROOT!;
    const projectDir = join(rootPath, "Gamma");
    await mkdir(projectDir, { recursive: true });

    const { writePrompt } = await import("@/lib/fs/prompts");
    await writePrompt(rootPath, "Gamma", {
      title: "Prompt Invalid",
      project: "Gamma",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: [],
      updatedAt: "invalid-date",
      createdAt: "invalid-date"
    }, "內容");

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    db.data!.inbox.push({
      id: "inbox-invalid",
      title: "",
      content: "",
      hint: "",
      createdAt: "not-a-date",
      updatedAt: null as any
    });
    await db.write();

    const { GET } = await import("@/app/api/settings/change-report/route");
    const res = await GET(new Request("http://localhost/api/settings/change-report"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it("returns 500 when dependencies fail", async () => {
    vi.doMock("@/lib/services/settings", () => ({
      getSettings: vi.fn(async () => {
        throw new Error("settings boom");
      })
    }));
    vi.doMock("@/lib/fs/prompts", () => ({
      listPrompts: vi.fn(async () => [])
    }));
    vi.doMock("@/lib/db", () => ({
      getDb: vi.fn(async () => ({ data: { inbox: [] } }))
    }));

    const { GET } = await import("@/app/api/settings/change-report/route");
    const res = await GET(new Request("http://localhost/api/settings/change-report"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toContain("settings boom");
  });
});
