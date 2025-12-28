import { describe, expect, it, vi } from "vitest";
import { join, dirname } from "path";
import { homedir, tmpdir } from "os";
import { rmSync } from "fs";

vi.mock("fs", async () => {
  const actual = await vi.importActual<any>("fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      realpath: vi.fn(async (p: string) => {
        const home = homedir();
        // keep home realpath working
        if (p === home) return home;
        // force a failure for some parents to cover the catch branch
        if (String(p).includes("pm-realpath-fail")) throw new Error("realpath failed");
        return p;
      })
    }
  };
});

describe("settings route - win32 path handling", () => {
  it("accepts logPath under home even when realpath(parent) fails", async () => {
    const { POST } = await import("@/app/api/settings/route");

    const target = join(homedir(), ".promptmgt-test", "pm-realpath-fail", "logs", "app.log");
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ logPath: target })
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.logPath).toBe(target);

    rmSync(join(homedir(), ".promptmgt-test", "pm-realpath-fail"), { recursive: true, force: true });
  });

  it("rejects logPath on a different drive (outside home)", async () => {
    const { POST } = await import("@/app/api/settings/route");

    // Windows relative() will return an absolute path if drive letters differ.
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ logPath: "D:\\outside\\app.log" })
      })
    );

    expect(res.status).toBe(400);
  });

  it("creates log directory chain when logPath points to non-existing folders under home", async () => {
    const { POST } = await import("@/app/api/settings/route");

    const underHome = join(homedir(), ".promptmgt-test", "pm-settings", "logs", "created.log");

    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ logPath: underHome })
      })
    );

    expect(res.status).toBe(200);
    rmSync(join(homedir(), ".promptmgt-test", "pm-settings"), { recursive: true, force: true });
  });
});
