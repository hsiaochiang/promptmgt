import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { access } from "fs/promises";
import { join } from "path";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

let restore: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restore = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restore) await restore();
});

describe("fs/projects", () => {
  it("生成預設路徑 README 並覆寫時沿用同一路徑", async () => {
    const { getDb } = await import("@/lib/db");
    const { readProjectReadme, writeProjectReadme } = await import("@/lib/fs/projects");

    const db = await getDb();
    const rootPath = db.data!.settings.rootPath ?? "";
    const projectName = "Fallback Project";
    const safeName = sanitizeFilename(projectName);

    const created = await readProjectReadme({ projectName, rootPath });
    expect(created.path.startsWith(rootPath)).toBe(true);
    expect(created.path).toContain(safeName);
    expect(created.path.toLowerCase()).toMatch(/readme\.md$/);
    await access(created.path);

    const updated = await writeProjectReadme({ projectName, rootPath, content: "# Updated" });
    expect(updated.path).toBe(created.path);

    const reread = await readProjectReadme({ projectName, rootPath });
    expect(reread.content).toContain("Updated");
  });
});
