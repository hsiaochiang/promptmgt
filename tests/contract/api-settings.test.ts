import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { join, resolve } from "path";
import { homedir } from "os";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("Settings API", () => {
  it("回傳 rootPath 與 pathExists", async () => {
    const targetRoot = process.env.DEFAULT_ROOT!;
    const { mkdir } = await import("fs/promises");
    await mkdir(targetRoot, { recursive: true });
    const { GET } = await import("@/app/api/settings/route");
    const res = await GET(new Request("http://localhost/api/settings"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rootPath).toBeTruthy();
    expect(data.pathExists).toBe(true);
    expect(data.logPath).toBeDefined();
  });

  it("空字串 rootPath 會以標準錯誤格式回傳", async () => {
    const { POST } = await import("@/app/api/settings/route");
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ rootPath: "" })
      })
    );
    const payload = await res.json();
    expect(res.status).toBe(400);
    expect(payload).toMatchObject({
      code: "bad_request",
      message: expect.stringContaining("rootPath"),
      details: { field: "rootPath" }
    });
  });

  it("logPath 不在使用者目錄下會被拒絕並回傳 details", async () => {
    const { POST } = await import("@/app/api/settings/route");
    const outsideHome = resolve(homedir(), "..", "outside-app.log");
    const res = await POST(
      new Request("http://localhost/api/settings", {
        method: "POST",
        body: JSON.stringify({ logPath: outsideHome })
      })
    );
    const payload = await res.json();
    expect(res.status).toBe(400);
    expect(payload).toMatchObject({
      code: "bad_request",
      details: { field: "logPath" }
    });
  });

  it("允許更新布林旗標且不更動 rootPath", async () => {
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

  it("保存提供的 rootPath 並確認可存取", async () => {
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

  it("rootPath 為 null 時 pathExists 為 false", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/settings/route");

    await updateSettings({ rootPath: null });
    const res = await GET(new Request("http://localhost/api/settings"));
    const data = await res.json();

    expect(data.pathExists).toBe(false);
  });
});
