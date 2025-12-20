import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { access, readFile } from "fs/promises";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("US2 - 草稿轉正整合流程", () => {
  it("移除 inbox 草稿、寫入檔案並更新專案計數與時間", async () => {
    const { archiveDraft } = await import("@/app/(workspace)/actions/archiveDraft");
    const { getDb } = await import("@/lib/db");

    const db = await getDb();
    const draft = db.data!.inbox[0];
    const project = db.data!.projects.find((p) => p.name === "AI 工作流課程")!;
    const initialCount = project.promptCount;
    const updatedAt = new Date().toISOString();

    const result = await archiveDraft({
      draftId: draft.id,
      projectName: project.name,
      frontmatter: {
        title: "轉正草稿",
        project: project.name,
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["demo"],
        updatedAt
      },
      body: "正式內容"
    });

    await access(result.filePath);
    const fileContent = await readFile(result.filePath, "utf8");
    expect(fileContent).toContain("轉正草稿");
    expect(fileContent).toContain("正式內容");

    const dbAfter = await getDb();
    expect(dbAfter.data!.inbox.find((i) => i.id === draft.id)).toBeUndefined();
    const projectAfter = dbAfter.data!.projects.find((p) => p.name === project.name)!;
    expect(projectAfter.promptCount).toBe(initialCount + 1);
    expect(projectAfter.updatedAt).toBe(updatedAt);
  });
});
