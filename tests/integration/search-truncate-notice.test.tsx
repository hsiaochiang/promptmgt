import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import os from "os";

describe("search-truncate-notice", () => {
  let rootPath: string;
  let dbFile: string;

  beforeEach(async () => {
    rootPath = mkdtempSync(join(os.tmpdir(), "pm-search-ui-"));
    const dbDir = mkdtempSync(join(os.tmpdir(), "pm-db-"));
    dbFile = join(dbDir, "db.json");

    process.env.DB_FILE = dbFile;
    vi.resetModules();

    const { updateSettings } = await import("@/lib/services/settings");
    await updateSettings({ rootPath });
  });

  afterEach(() => {
    if (rootPath) rmSync(rootPath, { recursive: true, force: true });
    if (dbFile) rmSync(dbFile, { recursive: true, force: true });
  });

  it("returns truncated flag when backend caps results", async () => {
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/search/route");

    for (let i = 0; i < 3; i++) {
      await writePrompt(
        rootPath,
        "proj-ui",
        {
          title: `UI Searchable ${i}`,
          project: "proj-ui",
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
  });
});
