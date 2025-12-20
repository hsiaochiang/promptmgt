import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  if (restoreWorkspace) await restoreWorkspace();
});

describe("telemetry sender", () => {
  it("skips when telemetry disabled", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    await updateSettings({ telemetryEnabled: false });

    const result = await sendTelemetry({ event: "app_start", timestamp: new Date().toISOString() });
    expect(result).toMatchObject({ skipped: true, reason: "disabled" });
  });

  it("blocks payload containing forbidden fields", async () => {
    const { sendTelemetry } = await import("@/lib/services/telemetry");

    const result = await sendTelemetry({
      event: "app_start",
      timestamp: new Date().toISOString(),
      title: "should-not-send"
    });
    expect(result).toMatchObject({ skipped: true, reason: "blocked" });
  });

  it("blocks payload missing required fields", async () => {
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    const result = await sendTelemetry({ appVersion: "0.1.0" });
    expect(result).toMatchObject({ skipped: true, reason: "blocked" });
  });

  it("sends sanitized payload over https", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    await updateSettings({ telemetryEnabled: true });
    const mockFetch = vi.fn(async () => new Response("ok", { status: 200 }));

    const result = await sendTelemetry(
      {
        event: "search_perf",
        timestamp: new Date().toISOString(),
        performance: { searchLatencyMs: 120 },
        counts: { prompts: 10 }
      },
      { endpoint: "https://telemetry.local/collect", fetcher: mockFetch }
    );

    expect(result).not.toHaveProperty("skipped");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: true, status: 200 });
  });

  it("rejects insecure endpoint", async () => {
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    const result = await sendTelemetry(
      { event: "app_start", timestamp: new Date().toISOString() },
      { endpoint: "http://insecure" }
    );
    expect(result).toMatchObject({ skipped: true, reason: "insecure-endpoint" });
  });

  it("returns error when fetch fails", async () => {
    const { sendTelemetry } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => {
      throw new Error("network");
    });
    const result = await sendTelemetry(
      { event: "app_start", timestamp: new Date().toISOString() },
      { endpoint: "https://telemetry.local/collect", fetcher: mockFetch }
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, error: "network" });
  });
});

describe("update checker", () => {
  it("skips when update check disabled", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    await updateSettings({ updateCheckEnabled: false });

    const result = await checkForUpdates("0.1.0");
    expect(result).toMatchObject({ status: "skipped", reason: "disabled" });
  });

  it("detects available update over https", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => new Response(JSON.stringify({ latestVersion: "0.2.0" }), { status: 200 }));

    const result = await checkForUpdates("0.1.0", { endpoint: "https://updates.local/check", fetcher: mockFetch });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "update-available", latestVersion: "0.2.0" });
  });

  it("returns up-to-date when latest equals current", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => new Response(JSON.stringify({ latestVersion: "0.1.0" }), { status: 200 }));

    const result = await checkForUpdates("0.1.0", { endpoint: "https://updates.local/check", fetcher: mockFetch });
    expect(result).toMatchObject({ status: "up-to-date", latestVersion: "0.1.0" });
  });

  it("skips update check on insecure endpoint", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const result = await checkForUpdates("0.1.0", { endpoint: "http://insecure" });
    expect(result).toMatchObject({ status: "skipped", reason: "insecure-endpoint" });
  });

  it("treats missing latestVersion as up-to-date", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }));
    const result = await checkForUpdates("0.1.0", { endpoint: "https://updates.local/check", fetcher: mockFetch });
    expect(result).toMatchObject({ status: "up-to-date", latestVersion: "0.1.0" });
  });

  it("returns failed when endpoint returns non-200", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => new Response("", { status: 500 }));
    const result = await checkForUpdates("0.1.0", { endpoint: "https://updates.local/check", fetcher: mockFetch });
    expect(result).toMatchObject({ status: "failed", reason: "status 500" });
  });

  it("returns failed when fetch throws", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const mockFetch = vi.fn(async () => {
      throw new Error("boom");
    });
    const result = await checkForUpdates("0.1.0", { endpoint: "https://updates.local/check", fetcher: mockFetch });
    expect(result).toMatchObject({ status: "failed", reason: "boom" });
  });
});
