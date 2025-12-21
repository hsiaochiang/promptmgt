import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "path";
import { mkdir } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
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
});
