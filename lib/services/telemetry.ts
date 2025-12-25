import { promises as fs } from "fs";
import { dirname, join } from "path";
import { getSettings } from "./settings";

export interface TelemetryPayload {
  event: string;
  timestamp: string;
  appVersion?: string;
  platform?: string;
  settings?: {
    telemetryEnabled?: boolean;
    updateCheckEnabled?: boolean;
  };
  counts?: {
    projects?: number;
    prompts?: number;
    inbox?: number;
    snippets?: number;
  };
  performance?: {
    searchLatencyMs?: number;
    pasteSizeKb?: number;
    autosaveMs?: number;
  };
  errors?: string;
  update?: {
    currentVersion?: string;
    latestVersion?: string;
    status?: string;
  };
}

type TelemetryEntry = { entry: TelemetryPayload; bytes: number };

const ALLOWED_ROOT_KEYS = new Set([
  "event",
  "timestamp",
  "appVersion",
  "platform",
  "settings",
  "counts",
  "performance",
  "errors",
  "update"
]);

const FORBIDDEN_KEYS = [
  "title",
  "project",
  "tags",
  "model",
  "status",
  "notes",
  "body",
  "content",
  "filename",
  "fileName",
  "path",
  "rootPath",
  "snippet",
  "prompt",
  "frontmatter",
  "query",
  "clipboard"
];

const MAX_BUFFER_BYTES = 5 * 1024 * 1024; // 5MB 環迴
const MAX_LOG_FILE_BYTES = 5 * 1024 * 1024; // 5MB 旋轉
const DEFAULT_EXPORT = join("logs", "app.log");
const MASK_PLACEHOLDER = "[REDACTED]";

let buffer: TelemetryEntry[] = [];
let bufferBytes = 0;

export function sanitizeTelemetryPayload(input: Record<string, unknown>): TelemetryPayload | null {
  if (Object.keys(input).some((key) => FORBIDDEN_KEYS.some((k) => key.toLowerCase().includes(k)))) {
    return null;
  }

  const output: Partial<TelemetryPayload> = {};
  for (const key of Object.keys(input)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) continue;
    const value = input[key];
    if (value === undefined) continue;
    output[key as keyof TelemetryPayload] = value as any;
  }

  if (typeof output.event !== "string" || typeof output.timestamp !== "string") return null;
  return output as TelemetryPayload;
}

function pushToBuffer(entry: TelemetryPayload) {
  const serialized = JSON.stringify(entry);
  const bytes = Buffer.byteLength(serialized, "utf8");

  while (buffer.length && bufferBytes + bytes > MAX_BUFFER_BYTES) {
    const removed = buffer.shift();
    if (removed) bufferBytes -= removed.bytes;
  }

  buffer.push({ entry, bytes });
  bufferBytes += bytes;
}

export function getTelemetryBuffer(): TelemetryPayload[] {
  return buffer.map((b) => b.entry);
}

export function clearTelemetryBuffer() {
  buffer = [];
  bufferBytes = 0;
}

interface SendOptions {
  exportPath?: string;
  flush?: boolean;
}

export async function sendTelemetry(payload: Record<string, unknown>, options: SendOptions = {}) {
  const settings = await getSettings();
  const globalEnabled = settings.telemetryEnabled ?? true;
  const scopedEnabled = settings.telemetry?.enabled ?? globalEnabled;
  const telemetryEnabled = globalEnabled && scopedEnabled;
  if (!telemetryEnabled) {
    return { skipped: true, reason: "disabled" } as const;
  }

  const sanitized = sanitizeTelemetryPayload(payload);
  if (!sanitized) return { skipped: true, reason: "blocked" } as const;

  pushToBuffer(sanitized);

  if (options.flush) {
    await exportTelemetry(options.exportPath);
  }

  return { ok: true, buffered: true, size: bufferBytes } as const;
}

function maskTelemetryEntry(entry: TelemetryPayload, rootPath?: string | null): TelemetryPayload {
  const normalizedRoot = rootPath ? rootPath.replace(/\\/g, "/").toLowerCase() : null;
  const maskValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      const normalized = value.replace(/\\/g, "/");
      const lowered = normalized.toLowerCase();
      if (
        (normalizedRoot && lowered.includes(normalizedRoot)) ||
        /^[a-z]:\//i.test(normalized) ||
        normalized.startsWith("/")
      ) {
        return MASK_PLACEHOLDER;
      }
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((v) => maskValue(v));
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, maskValue(val)])
      );
    }
    return value;
  };

  return maskValue(entry) as TelemetryPayload;
}

async function resolveExportTarget(explicitPath?: string) {
  const settings = await getSettings();
  const candidate = explicitPath ?? settings.telemetry?.exportPath ?? settings.logPath;
  const normalizedCandidate = typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
  const fallback = settings.rootPath ? join(settings.rootPath, DEFAULT_EXPORT) : null;
  return { path: normalizedCandidate ?? fallback, settings };
}

async function rotateIfNeeded(targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    if (stats.size >= MAX_LOG_FILE_BYTES) {
      const rotated = `${targetPath}.1`;
      await fs.rm(rotated, { force: true });
      await fs.rename(targetPath, rotated);
    }
  } catch (err: any) {
    if (err?.code !== "ENOENT") throw err;
  }
}

export async function exportTelemetry(filePath?: string) {
  const { path: targetPath, settings } = await resolveExportTarget(filePath);
  if (!targetPath) return { skipped: true, reason: "no-path" } as const;

  const dir = dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  await rotateIfNeeded(targetPath);

  const contents = buffer
    .map((b) => JSON.stringify(maskTelemetryEntry(b.entry, settings.rootPath)))
    .join("\n");
  await fs.writeFile(targetPath, contents, "utf8");

  return { ok: true, path: targetPath, bytesWritten: Buffer.byteLength(contents, "utf8") } as const;
}

interface UpdateCheckResult {
  status: "up-to-date" | "update-available" | "skipped" | "failed";
  latestVersion?: string;
  reason?: string;
}

interface UpdateOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
}

export async function checkForUpdates(currentVersion: string, options: UpdateOptions = {}): Promise<UpdateCheckResult> {
  const settings = await getSettings();
  const updateEnabled = settings.updateCheckEnabled ?? true;
  if (!updateEnabled) {
    return { status: "skipped", reason: "disabled" };
  }

  const endpoint = options.endpoint ?? process.env.UPDATE_CHECK_ENDPOINT ?? null;
  if (!endpoint) {
    return { status: "skipped", reason: "no-endpoint" };
  }
  if (!endpoint.startsWith("https://")) {
    return { status: "skipped", reason: "insecure-endpoint" };
  }

  const doFetch = options.fetcher ?? fetch;
  try {
    const res = await doFetch(endpoint);
    if (!res.ok) return { status: "failed", reason: `status ${res.status}` };
    const data = (await res.json()) as { latestVersion?: string };
    if (data.latestVersion && data.latestVersion !== currentVersion) {
      return { status: "update-available", latestVersion: data.latestVersion };
    }
    return { status: "up-to-date", latestVersion: data.latestVersion ?? currentVersion };
  } catch (err) {
    return { status: "failed", reason: err instanceof Error ? err.message : "unknown" };
  }
}
