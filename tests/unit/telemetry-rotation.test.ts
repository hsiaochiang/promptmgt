import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { join, dirname } from "path";
import { readFile, stat, writeFile, mkdir } from "fs/promises";
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

describe("telemetry log rotation and masking", () => {
  it("masks sensitive paths before exporting", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, exportTelemetry } = await import("@/lib/services/telemetry");

    const rootPath = process.env.DEFAULT_ROOT!;
    const logPath = join(rootPath, "logs", "app.log");
    const sensitivePath = join(rootPath, "secret", "trace.txt");

    await updateSettings({ telemetryEnabled: true, logPath });
    await sendTelemetry({
      event: "error",
      timestamp: new Date().toISOString(),
      errors: `failed at ${sensitivePath}`
    });

    const result = await exportTelemetry();
    expect(result).toMatchObject({ ok: true, path: logPath });

    const contents = await readFile(logPath, "utf8");
    expect(contents).not.toContain(sensitivePath.replace(/\\/g, "/"));
    expect(contents).toContain("[REDACTED]");
  });

  it("rotates log file when exceeding 5MB", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { sendTelemetry, exportTelemetry } = await import("@/lib/services/telemetry");

    const rootPath = process.env.DEFAULT_ROOT!;
    const logPath = join(rootPath, "logs", "app.log");
    await mkdir(dirname(logPath), { recursive: true });
    await writeFile(logPath, "x".repeat(6 * 1024 * 1024), "utf8");

    await updateSettings({ telemetryEnabled: true, logPath });
    await sendTelemetry({
      event: "rotation-check",
      timestamp: new Date().toISOString(),
      errors: "ok"
    });
    const result = await exportTelemetry();
    expect(result).toMatchObject({ ok: true, path: logPath });

    const rotatedStats = await stat(`${logPath}.1`);
    expect(rotatedStats.size).toBeGreaterThan(5 * 1024 * 1024);

    const newStats = await stat(logPath);
    expect(newStats.size).toBeLessThanOrEqual(5 * 1024 * 1024);

    const contents = await readFile(logPath, "utf8");
    expect(contents).toContain("rotation-check");
  });
});
