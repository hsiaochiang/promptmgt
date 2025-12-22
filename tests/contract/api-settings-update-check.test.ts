import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;
const originalFetch = global.fetch;
const originalEndpoint = process.env.UPDATE_CHECK_ENDPOINT;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
  process.env.UPDATE_CHECK_ENDPOINT = originalEndpoint;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Update check API", () => {
  it("skips when update check disabled", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/settings/update-check/route");

    await updateSettings({ updateCheckEnabled: false });
    const res = await GET(new Request("http://localhost/api/settings/update-check"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("skipped");
    expect(data.reason).toBe("disabled");
  });

  it("skips when endpoint is missing", async () => {
    process.env.UPDATE_CHECK_ENDPOINT = "";
    const { GET } = await import("@/app/api/settings/update-check/route");

    const res = await GET(new Request("http://localhost/api/settings/update-check"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("skipped");
    expect(data.reason).toBe("no-endpoint");
  });

  it("reports update available when endpoint returns newer version", async () => {
    process.env.UPDATE_CHECK_ENDPOINT = "https://updates.local/check";
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ latestVersion: "9.9.9" }), { status: 200 })
    ) as any;

    const { GET } = await import("@/app/api/settings/update-check/route");
    const res = await GET(new Request("http://localhost/api/settings/update-check"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("update-available");
    expect(data.latestVersion).toBe("9.9.9");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
