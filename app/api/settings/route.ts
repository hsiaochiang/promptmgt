import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { basename, dirname, join, relative, resolve, isAbsolute } from "path";
import { homedir } from "os";
import { getSettings, updateSettings } from "@/lib/services/settings";
import { badRequest } from "@/app/api/_lib/responses";

function normalizePathInput(value: unknown) {
  if (value === null) return null;
  return typeof value === "string" ? value.trim() : undefined;
}

async function normalizeForUserDirCheck(target: string) {
  const abs = resolve(target);
  if (process.platform !== "win32") return abs;

  const parent = dirname(abs);
  try {
    const realParent = await fs.realpath(parent);
    const suffix = abs.substring(parent.length).replace(/^[/\\]/, "");
    return join(realParent, suffix);
  } catch {
    return abs;
  }
}

async function isUnderUserDir(target: string) {
  const normalizedHome = resolve(homedir());
  const home =
    process.platform === "win32" ? await fs.realpath(normalizedHome).catch(() => normalizedHome) : normalizedHome;
  const targetPath = await normalizeForUserDirCheck(target);

  const rel = relative(home, targetPath);
  if (!rel) return true;
  if (isAbsolute(rel)) return false;
  return !rel.startsWith("..") && !rel.startsWith("..\\") && !rel.startsWith("../");
}

function getDefaultRoot() {
  return process.env.DEFAULT_ROOT || join(homedir(), ".promptmgt");
}

function resolveLogPath(_rootPath: string | null, logPath?: string) {
  const trimmed = logPath?.trim();
  if (trimmed) return trimmed;
  return join(getDefaultRoot(), "logs", "app.log");
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
    if (!(await isUnderUserDir(targetLogPath))) {
      const userDir = resolve(homedir());
      return badRequest("logPath must stay under user directory", {
        field: "logPath",
        userDir,
        example: join(userDir, ".promptmgt", "logs", "app.log")
      });
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
