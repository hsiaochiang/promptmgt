import { describe, it, expect } from "vitest";
import { resolve, join } from "path";
import { homedir, tmpdir } from "os";
import { mkdtempSync, rmSync } from "fs";

describe("settings route branches", () => {
  it("rejects empty rootPath and disallows logPath outside home", async () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "settings-"));
    const { POST } = await import("@/app/api/settings/route");

    const emptyRoot = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ rootPath: "" })
      })
    );
    expect(emptyRoot.status).toBe(400);

    const outsideHome = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ rootPath: tempRoot, logPath: resolve(homedir(), "..", "outside.log") })
      })
    );
    expect(outsideHome.status).toBe(400);

    rmSync(tempRoot, { recursive: true, force: true });
  });
});
