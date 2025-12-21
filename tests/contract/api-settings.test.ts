import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join } from "path";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("Settings API", () => {
  it("reports pathExists when rootPath is available", async () => {
    const targetRoot = process.env.DEFAULT_ROOT!;
    const { mkdir } = await import("fs/promises");
    await mkdir(targetRoot, { recursive: true });
    const { GET } = await import("@/app/api/settings/route");
    const res = await GET(new Request("http://localhost/api/settings"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rootPath).toBeTruthy();
    expect(data.pathExists).toBe(true);
  });

  it("rejects empty rootPath on update", async () => {
    const { POST } = await import("@/app/api/settings/route");
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ rootPath: "" })
      })
    );
    expect(res.status).toBe(400);
  });

  it("allows updating toggles without changing rootPath", async () => {
    const { POST } = await import("@/app/api/settings/route");

    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ telemetryEnabled: false, updateCheckEnabled: false })
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.telemetryEnabled).toBe(false);
    expect(data.updateCheckEnabled).toBe(false);
  });

  it("saves provided rootPath and ensures accessibility", async () => {
    const { POST } = await import("@/app/api/settings/route");
    const targetRoot = join(process.env.DEFAULT_ROOT!, "new-root");
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ rootPath: targetRoot, telemetryEnabled: false })
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rootPath).toBe(targetRoot);
    expect(data.pathExists).toBe(true);
  });

  it("reports pathExists false when rootPath is unset", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/settings/route");

    await updateSettings({ rootPath: null });
    const res = await GET(new Request("http://localhost/api/settings"));
    const data = await res.json();

    expect(data.pathExists).toBe(false);
  });
});
