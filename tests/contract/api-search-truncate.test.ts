import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import os from "os";

describe("api-search-truncate", () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = mkdtempSync(join(os.tmpdir(), "pm-search-"));
    const { updateSettings } = await import("@/lib/services/settings");
    await updateSettings({ rootPath });
  });

  afterEach(() => {
    if (rootPath) rmSync(rootPath, { recursive: true, force: true });
  });

  it("returns truncated=true when results exceed limit", async () => {
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/search/route");

    // 準備 3 筆資料，查詢 limit=2 即應截斷
    for (let i = 0; i < 3; i++) {
      await writePrompt(
        rootPath,
        "proj-1",
        {
          title: `Searchable ${i}`,
          project: "proj-1",
          type: "測試",
          status: "使用中",
          model: "gpt-4",
          tags: ["match"],
          updatedAt: new Date().toISOString()
        },
        "body"
      );
    }

    const response = await GET(new Request("http://localhost/api/search?q=Searchable&limit=2"));
    const payload = await response.json();

    expect(payload.truncated).toBe(true);
    expect(payload.results).toHaveLength(2);
    expect(payload.results[0]).toMatchObject({
      title: expect.stringContaining("Searchable"),
      snippet: expect.any(String)
    });
  });

  it(
    "caps requested limit to 1000 and reports truncation",
    { timeout: 15000 },
    async () => {
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/search/route");

      for (let i = 0; i < 1005; i++) {
      await writePrompt(
        rootPath,
        "proj-1",
        {
          title: `Bulk Match ${i}`,
          project: "proj-1",
          type: "測試",
          status: "使用中",
          model: "gpt-4",
          tags: ["match"],
          updatedAt: new Date().toISOString()
        },
        "body"
      );
    }

      const response = await GET(new Request("http://localhost/api/search?q=Bulk&limit=5000"));
      const payload = await response.json();

      expect(payload.results).toHaveLength(1000);
      expect(payload.truncated).toBe(true);
    }
  );
});
