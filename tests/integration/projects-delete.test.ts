import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "path";
import { access } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("US2 - 專案刪除 API", () => {
  it("刪除專案時移除資料夾並刷新剩餘專案計數", async () => {
    const { getDb } = await import("@/lib/db");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { DELETE, GET } = await import("@/app/api/projects/route");

    const db = await getDb();
    const rootPath = db.data!.settings.rootPath ?? process.env.DEFAULT_ROOT;
    if (!rootPath) throw new Error("missing rootPath for test setup");

    await writePrompt(
      rootPath,
      "企業資金詢價平台",
      {
        title: "待刪除專案的提示詞",
        project: "企業資金詢價平台",
        type: "其他",
        status: "使用中",
        model: "gpt-4o-mini",
        tags: [],
        updatedAt: new Date().toISOString()
      },
      "body"
    );

    await writePrompt(
      rootPath,
      "AI 工作流課程",
      {
        title: "保留專案的提示詞",
        project: "AI 工作流課程",
        type: "其他",
        status: "使用中",
        model: "gpt-4o-mini",
        tags: [],
        updatedAt: new Date().toISOString()
      },
      "body"
    );

    const res = await DELETE(
      new Request("http://localhost/api/projects", {
        method: "DELETE",
        body: JSON.stringify({ id: "proj-2" })
      })
    );
    expect(res.status).toBe(200);

    // 專案資料夾已移除
    await expect(access(join(rootPath, "企業資金詢價平台"))).rejects.toThrow();

    // 剩餘專案計數依檔案重算
    const projectsRes = await GET();
    const projects = await projectsRes.json();
    const remaining = projects.find((p: any) => p.id === "proj-1");
    expect(remaining.promptCount).toBe(1);
  });
});
