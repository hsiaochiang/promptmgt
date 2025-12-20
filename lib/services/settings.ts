import { getDb } from "../db";
import type { Settings } from "../types/schema";

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  return db.data!.settings;
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  db.data!.settings = { ...db.data!.settings, ...partial };
  await db.write();
  return db.data!.settings;
}
