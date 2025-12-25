import { getDb } from "../db";
import type { Settings } from "../types/schema";
import { toIsoWithOffset } from "../utils/date";

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  return db.data!.settings;
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  const { pathExists: _omitPathExists, ...rest } = partial;
  const { pathExists: _prevOmitted, ...prev } = db.data!.settings as Settings & { pathExists?: boolean };
  const now = toIsoWithOffset();
  const next: Settings = {
    ...prev,
    ...rest,
    createdAt: prev.createdAt ?? now,
    updatedAt: now
  };
  db.data!.settings = next;
  await db.write();
  return next;
}
