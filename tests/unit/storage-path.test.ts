import { mkdtemp } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";

describe("storage-path", () => {
  it("ensures default hidden directory is created under user home when DEFAULT_ROOT not provided", async () => {
    const originalDefaultRoot = process.env.DEFAULT_ROOT;
    const originalDbFile = process.env.DB_FILE;

    const tempDir = await mkdtemp(join(tmpdir(), "pmgt-storage-test-"));
    process.env.DB_FILE = join(tempDir, "db.json");
    delete process.env.DEFAULT_ROOT;

    vi.resetModules();
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    const defaultRoot = db.data!.settings.rootPath!;

    expect(defaultRoot.endsWith(".promptmgt")).toBe(true);
    expect(existsSync(defaultRoot)).toBe(true);

    process.env.DEFAULT_ROOT = originalDefaultRoot;
    process.env.DB_FILE = originalDbFile;
    vi.resetModules();
  });
});
