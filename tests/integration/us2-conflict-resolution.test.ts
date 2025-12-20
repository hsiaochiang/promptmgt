import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import { promises as fs } from "fs";
import path from "path";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) {
    await restoreWorkspace();
  }
});

function encodeId(filePath: string) {
  return Buffer.from(filePath).toString("base64url");
}

describe("US2 - 衝突處理整合測試", () => {
  it("偵測到外部變更時應返回 409", async () => {
    const { POST: savePrompt } = await import("@/app/api/prompts/[id]/route");
    
    // 假設有一個現有的提示詞檔案
    const filePath = path.join(process.cwd(), "test-prompts", "test.md");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "---\nproject: Test\n---\nInitial content", "utf8");
    const id = encodeId(filePath);

    // 第一次讀取獲取正確的 hash
    const { GET: readPrompt } = await import("@/app/api/prompts/[id]/route");
    const readRes = await readPrompt(new Request(`http://localhost/api/prompts/${id}`), { params: { id } });
    const { hash: initialHash } = await readRes.json();

    // 模擬外部變更 (手動修改檔案)
    await fs.writeFile(filePath, "---\nproject: Test\n---\nExternal change", "utf8");

    // 嘗試用舊的 hash 儲存，應觸發 409
    const saveRes = await savePrompt(
      new Request(`http://localhost/api/prompts/${id}`, {
        method: "POST",
        body: JSON.stringify({
          frontmatter: { project: "Test" },
          body: "My local change",
          clientHash: initialHash
        })
      }),
      { params: { id } }
    );

    expect(saveRes.status).toBe(409);
    const errorData = await saveRes.json();
    expect(errorData.message).toBe("Conflict detected");
    expect(errorData.currentHash).toBeDefined();
  });

  it("使用最新的 hash 儲存應能成功覆寫 (Overwrite 流程)", async () => {
    const { POST: savePrompt } = await import("@/app/api/prompts/[id]/route");
    const filePath = path.join(process.cwd(), "test-prompts", "overwrite.md");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "---\nproject: Test\n---\nOriginal", "utf8");
    const id = encodeId(filePath);

    // 外部變更發生
    await fs.writeFile(filePath, "---\nproject: Test\n---\nExternal", "utf8");
    
    // 獲取最新 hash
    const { GET: readPrompt } = await import("@/app/api/prompts/[id]/route");
    const readRes = await readPrompt(new Request(`http://localhost/api/prompts/${id}`), { params: { id } });
    const { hash: latestHash } = await readRes.json();

    // 使用最新 hash 進行儲存 (模擬 Overwrite 點擊後的行為)
    const saveRes = await savePrompt(
      new Request(`http://localhost/api/prompts/${id}`, {
        method: "POST",
        body: JSON.stringify({
          frontmatter: { project: "Test" },
          body: "Local Overwrite",
          clientHash: latestHash
        })
      }),
      { params: { id } }
    );

    expect(saveRes.status).toBe(200);
    const finalContent = await fs.readFile(filePath, "utf8");
    expect(finalContent).toContain("Local Overwrite");
  });
});
