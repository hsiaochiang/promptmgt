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
  const prev = db.data!.settings;
  const now = toIsoWithOffset();
  db.data!.settings = {
    ...prev,
    ...rest,
    createdAt: prev.createdAt ?? now,
    updatedAt: now
  };
  await db.write();
  return db.data!.settings;
}
