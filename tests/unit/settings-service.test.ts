import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";

const isIsoUtc8 = (value?: string | null) => typeof value === "string" && /\+08:00$/.test(value);

let restore: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restore = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restore) await restore();
});

describe("settings service", () => {
  it("updates timestamps to ISO+08 and ignores pathExists flag", async () => {
    const { getDb } = await import("@/lib/db");
    const { updateSettings } = await import("@/lib/services/settings");

    const db = await getDb();
    const prevUpdatedAt = db.data!.settings.updatedAt;
    delete (db.data!.settings as any).createdAt;
    await db.write();

    const result = await updateSettings({ pathExists: true as any, telemetryEnabled: false });

    expect(isIsoUtc8(result.createdAt)).toBe(true);
    expect(isIsoUtc8(result.updatedAt)).toBe(true);
    expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(new Date(prevUpdatedAt).getTime());
    expect((db.data!.settings as any).pathExists).toBeUndefined();
    expect(db.data!.settings.telemetryEnabled).toBe(false);
  });
});
