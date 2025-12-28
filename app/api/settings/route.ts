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

async function isUnderDir(target: string, baseDir: string) {
  const normalizedBase = resolve(baseDir);
  const targetPath = await normalizeForUserDirCheck(target);
  const targetResolved = resolve(target);

  const check = (base: string, candidate: string) => {
    const rel = relative(base, candidate);
    if (!rel) return true;
    if (isAbsolute(rel)) return false;
    return !rel.startsWith("..") && !rel.startsWith("..\\") && !rel.startsWith("../");
  };

  if (process.platform !== "win32") {
    return check(normalizedBase, targetPath);
  }

  const baseReal = await fs.realpath(normalizedBase).catch(() => normalizedBase);

  // Windows 上 realpath 可能回傳不同格式（例如 UNC/長路徑前綴）。
  // 若 target 的 parent 尚不存在，normalizeForUserDirCheck 會退回 abs（非 realpath），
  // 這時 baseReal vs targetPath 可能出現格式不一致，導致 relative() 誤判為跨磁碟。
  return check(baseReal, targetPath) || check(normalizedBase, targetResolved);
}

async function isUnderUserDir(target: string) {
  return isUnderDir(target, homedir());
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
    const underUser = await isUnderUserDir(targetLogPath);
    const underRoot = typeof targetRoot === "string" && targetRoot.trim() ? await isUnderDir(targetLogPath, targetRoot) : false;
    if (!underUser && !underRoot) {
      const userDir = resolve(homedir());
      return badRequest("logPath must stay under user directory or rootPath", {
        field: "logPath",
        userDir,
        rootPath: targetRoot,
        examples: [
          join(userDir, ".promptmgt", "logs", "app.log"),
          typeof targetRoot === "string" && targetRoot.trim() ? join(targetRoot, "logs", "app.log") : null
        ].filter(Boolean)
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
