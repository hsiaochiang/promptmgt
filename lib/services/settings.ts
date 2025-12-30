import { getDb } from "../db";
import type { Settings } from "../types/schema";
import { ensureIsoUtc8, toIsoWithOffset } from "../utils/date";
import { join } from "path";
import { homedir } from "os";

function getDefaultRoot() {
  return process.env.DEFAULT_ROOT || join(homedir(), ".promptmgt");
}

function resolveLogPath(rootPath?: string | null, logPath?: string | null) {
  const candidate = typeof logPath === "string" && logPath.trim().length > 0 ? logPath.trim() : null;
  if (candidate) return candidate;
  return join(getDefaultRoot(), "logs", "app.log");
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const settings = db.data!.settings;
  const logPath = resolveLogPath(settings.rootPath, settings.logPath) ?? settings.logPath;
  return {
    ...settings,
    createdAt: ensureIsoUtc8((settings as any).createdAt),
    updatedAt: ensureIsoUtc8((settings as any).updatedAt),
    logPath: logPath ?? ""
  };
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  const { pathExists: _omitPathExists, ...rest } = partial;
  const { pathExists: _prevOmitted, ...prev } = db.data!.settings as Settings & { pathExists?: boolean };
  const now = toIsoWithOffset();
  const rootPath =
    rest.rootPath === null
      ? null
      : typeof rest.rootPath === "string"
        ? rest.rootPath
        : prev.rootPath;
  const rootChanged = rest.rootPath !== undefined && rootPath !== prev.rootPath;
  const prevDefaultLog = resolveLogPath(prev.rootPath, null);
  const shouldRebaseLogPath = rootChanged && prevDefaultLog && prev.logPath === prevDefaultLog && rest.logPath === undefined;
  const logPathInput = rest.logPath === null ? null : shouldRebaseLogPath ? null : rest.logPath ?? prev.logPath;
  const resolvedLogPath =
    resolveLogPath(rootPath, logPathInput) ??
    prev.logPath ??
    resolveLogPath(rootPath, null) ??
    "logs/app.log";
  const next: Settings = {
    ...prev,
    ...rest,
    rootPath,
    logPath: resolvedLogPath,
    createdAt: prev.createdAt ? ensureIsoUtc8(prev.createdAt) : now,
    updatedAt: now
  };
  db.data!.settings = next;
  await db.write();
  return next;
}
