import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import { Buffer } from "node:buffer";
import { parsePrompt } from "@/lib/utils/frontmatter";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("T072 - Frontmatter 時區序列化", () => {
  it("建立提示詞時自動以 ISO+08:00 寫入 createdAt/updatedAt", async () => {
    const { POST } = await import("@/app/api/prompts/route");

    const res = await POST(
      new Request("http://localhost/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: {
            title: "時區測試",
            project: "TZProj",
            type: "其他",
            status: "草稿",
            model: "gpt-4o-mini",
            tags: []
          },
          body: "內容"
        })
      })
    );

    expect(res.status).toBe(201);
    const payload = await res.json();
    const filePath = Buffer.from(payload.id, "base64url").toString("utf8");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parsePrompt(raw);

    expect(parsed.frontmatter?.updatedAt).toMatch(/\+08:00$/);
    expect(parsed.frontmatter?.createdAt).toMatch(/\+08:00$/);
  });
});
