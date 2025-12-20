import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { vi } from "vitest";

export async function setupIsolatedWorkspace() {
  const tempDir = await mkdtemp(join(tmpdir(), "promptmgt-"));
  const previousEnv = {
    DB_FILE: process.env.DB_FILE,
    DEFAULT_ROOT: process.env.DEFAULT_ROOT
  };

  process.env.DB_FILE = join(tempDir, "db.json");
  process.env.DEFAULT_ROOT = join(tempDir, "Prompts");
  vi.resetModules();

  return async () => {
    process.env.DB_FILE = previousEnv.DB_FILE;
    process.env.DEFAULT_ROOT = previousEnv.DEFAULT_ROOT;
    await rm(tempDir, { recursive: true, force: true });
    vi.resetModules();
  };
}
