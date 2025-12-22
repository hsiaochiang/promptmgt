import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

describe("T077 - 全實體時間欄位自動補值為 ISO+08:00", () => {
  it("project/inbox/snippet/prompt/settings 皆自動帶 createdAt/updatedAt 且為 UTC+08", async () => {
    const { POST: postProject } = await import("@/app/api/projects/route");
    const { POST: postInbox } = await import("@/app/api/inbox/route");
    const { POST: postSnippet } = await import("@/app/api/snippets/route");
    const { POST: postPrompt } = await import("@/app/api/prompts/route");
    const { POST: postSettings } = await import("@/app/api/settings/route");
    const { getDb } = await import("@/lib/db");

    const projectRes = await postProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "新專案" })
      })
    );
    expect(projectRes.status).toBe(201);

    const inboxRes = await postInbox(
      new Request("http://localhost/api/inbox", {
        method: "POST",
        body: JSON.stringify({ title: "時區草稿" })
      })
    );
    expect(inboxRes.status).toBe(201);

    const snippetRes = await postSnippet(
      new Request("http://localhost/api/snippets", {
        method: "POST",
        body: JSON.stringify({ name: "時區片語", category: "測試", content: "content" })
      })
    );
    expect(snippetRes.status).toBe(201);

    const promptRes = await postPrompt(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: {
            title: "時區提示詞",
            project: "TZProj",
            type: "其他",
            status: "草稿",
            model: "",
            tags: []
          },
          body: "內容"
        })
      })
    );
    expect(promptRes.status).toBe(201);
    const promptPayload = await promptRes.json();
    expect(isIsoUtc8(promptPayload.frontmatter?.createdAt)).toBe(true);
    expect(isIsoUtc8(promptPayload.frontmatter?.updatedAt)).toBe(true);

    const db = await getDb();
    const proj = db.data!.projects.find((p) => p.name === "新專案");
    expect(proj).toBeTruthy();
    expect(isIsoUtc8(proj?.createdAt)).toBe(true);
    expect(isIsoUtc8(proj?.updatedAt)).toBe(true);

    const inbox = db.data!.inbox.find((i) => i.title === "時區草稿");
    expect(inbox).toBeTruthy();
    expect(isIsoUtc8(inbox?.createdAt)).toBe(true);
    expect(isIsoUtc8(inbox?.updatedAt)).toBe(true);

    const snippet = db.data!.snippets.find((s) => s.name === "時區片語");
    expect(snippet).toBeTruthy();
    expect(isIsoUtc8((snippet as any)?.createdAt)).toBe(true);
    expect(isIsoUtc8((snippet as any)?.updatedAt)).toBe(true);

    const beforeSettings = db.data!.settings;
    const nextRoot = join(beforeSettings.rootPath ?? "", "nested-root");
    const settingsRes = await postSettings(
      new Request("http://localhost/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootPath: nextRoot })
      })
    );
    expect(settingsRes.status).toBe(200);

    const dbAfter = await getDb();
    const settings = dbAfter.data!.settings;
    expect(isIsoUtc8(settings.createdAt)).toBe(true);
    expect(isIsoUtc8(settings.updatedAt)).toBe(true);
    expect(new Date(settings.updatedAt).getTime()).toBeGreaterThan(new Date(beforeSettings.updatedAt).getTime());
    expect(settings.rootPath).toBe(nextRoot);
  });
});
