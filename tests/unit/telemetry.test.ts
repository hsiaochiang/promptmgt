import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  const { clearTelemetryBuffer } = await import("@/lib/services/telemetry");
  clearTelemetryBuffer();
  if (restoreWorkspace) await restoreWorkspace();
});

describe("telemetry sender", () => {
  it("skips when telemetry disabled", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, getTelemetryBuffer } = await import("@/lib/services/telemetry");
    await updateSettings({ telemetryEnabled: false });

    const result = await sendTelemetry({ event: "app_start", timestamp: new Date().toISOString() });
    expect(result).toMatchObject({ skipped: true, reason: "disabled" });
    expect(getTelemetryBuffer()).toHaveLength(0);
  });

  it("blocks payload containing forbidden fields", async () => {
    const { sendTelemetry, getTelemetryBuffer } = await import("@/lib/services/telemetry");

    const result = await sendTelemetry({
      event: "app_start",
      timestamp: new Date().toISOString(),
      title: "should-not-send"
    });
    expect(result).toMatchObject({ skipped: true, reason: "blocked" });
    expect(getTelemetryBuffer()).toHaveLength(0);
  });

  it("buffers sanitized payload locally", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, getTelemetryBuffer } = await import("@/lib/services/telemetry");
    await updateSettings({ telemetryEnabled: true });

    const result = await sendTelemetry({
      event: "search_perf",
      timestamp: new Date().toISOString(),
      performance: { searchLatencyMs: 120 },
      counts: { prompts: 10 }
    });

    expect(result).toMatchObject({ ok: true, buffered: true });
    const buffered = getTelemetryBuffer();
    expect(buffered).toHaveLength(1);
    expect(buffered[0]).toMatchObject({ event: "search_perf" });
  });

  it("evicts oldest entries when exceeding 5MB", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, getTelemetryBuffer } = await import("@/lib/services/telemetry");
    await updateSettings({ telemetryEnabled: true });

    const large = "x".repeat(3 * 1024 * 1024);
    await sendTelemetry({ event: "big-1", timestamp: new Date().toISOString(), errors: large });
    await sendTelemetry({ event: "big-2", timestamp: new Date().toISOString(), errors: large });

    const buffered = getTelemetryBuffer();
    expect(buffered).toHaveLength(1);
    expect(buffered[0].event).toBe("big-2");
  });

  it("exports buffer to file", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, exportTelemetry } = await import("@/lib/services/telemetry");
    const { mkdtemp } = await import("fs/promises");
    const { tmpdir } = await import("os");
    const { join } = await import("path");

    const dir = await mkdtemp(join(tmpdir(), "telemetry-"));
    const exportPath = join(dir, "events.log");
    await updateSettings({ telemetryEnabled: true, telemetry: { enabled: true, exportPath } });

    await sendTelemetry({ event: "app_start", timestamp: new Date().toISOString() });
    const result = await exportTelemetry();

    expect(result).toMatchObject({ ok: true, path: exportPath });
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

  it("skips when endpoint is missing", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const result = await checkForUpdates("0.1.0", { endpoint: undefined });
    expect(result).toMatchObject({ status: "skipped", reason: "no-endpoint" });
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
