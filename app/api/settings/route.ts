import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { getSettings, updateSettings } from "@/lib/services/settings";
import { badRequest } from "@/app/api/_lib/responses";

function normalizePathInput(value: unknown) {
  if (value === null) return null;
  return typeof value === "string" ? value.trim() : undefined;
}

function isUnderUserDir(target: string) {
  const normalizedTarget = resolve(target);
  const normalizedHome = resolve(homedir());
  if (process.platform === "win32") {
    return normalizedTarget.toLowerCase().startsWith(normalizedHome.toLowerCase());
  }
  return normalizedTarget.startsWith(normalizedHome);
}

function resolveLogPath(rootPath: string | null, logPath?: string) {
  const trimmed = logPath?.trim();
  if (trimmed) return trimmed;
  if (rootPath) return join(rootPath, "logs", "app.log");
  return null;
}

export async function GET(_request: Request) {
  const settings = await getSettings();
  const rootPath = settings.rootPath ?? "";
  const logPath = resolveLogPath(rootPath, settings.logPath) ?? "";
  const pathExists = rootPath ? await fs.access(rootPath).then(() => true).catch(() => false) : false;
  return NextResponse.json({ ...settings, logPath, pathExists });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const currentSettings = await getSettings();
  const nextRoot = normalizePathInput(payload.rootPath);
  const nextLogPath = normalizePathInput(payload.logPath);
  const targetRoot = nextRoot !== undefined ? nextRoot : currentSettings.rootPath ?? null;

  if (nextRoot !== undefined && nextRoot !== null) {
    if (!nextRoot) {
      return badRequest("rootPath is required", { field: "rootPath" });
    }
    try {
      await fs.mkdir(nextRoot, { recursive: true });
      await fs.access(nextRoot);
    } catch (error: any) {
      return badRequest("rootPath is not accessible", { message: error?.message });
    }
  }

  let targetLogPath = resolveLogPath(targetRoot, nextLogPath ?? currentSettings.logPath);
  if (!targetLogPath && targetRoot) {
    targetLogPath = resolveLogPath(targetRoot, undefined);
  }
  const shouldValidateLogPath = nextLogPath !== undefined;
  if (shouldValidateLogPath) {
    if (!targetLogPath) {
      return badRequest("logPath is required", { field: "logPath" });
    }
    if (!isUnderUserDir(targetLogPath)) {
      return badRequest("logPath must stay under user directory", { field: "logPath" });
    }
  }
  if (targetLogPath) {
    try {
      await fs.mkdir(dirname(targetLogPath), { recursive: true });
      await fs.access(dirname(targetLogPath));
    } catch (error: any) {
      return badRequest("logPath is not accessible", { message: error?.message });
    }
  }

  const updated = await updateSettings({ ...payload, rootPath: targetRoot ?? null, logPath: targetLogPath ?? undefined });
  const pathExists = updated.rootPath ? await fs.access(updated.rootPath).then(() => true).catch(() => false) : false;
  return NextResponse.json({ ...updated, logPath: targetLogPath ?? updated.logPath, pathExists });
}
