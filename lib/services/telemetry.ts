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
const DEFAULT_EXPORT = "telemetry.log";

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

async function resolveExportPath(explicitPath?: string) {
  const settings = await getSettings();
  const candidate = explicitPath ?? settings.telemetry?.exportPath;
  if (candidate) return candidate;
  if (settings.rootPath) return join(settings.rootPath, DEFAULT_EXPORT);
  return null;
}

export async function exportTelemetry(filePath?: string) {
  const targetPath = await resolveExportPath(filePath);
  if (!targetPath) return { skipped: true, reason: "no-path" } as const;

  const dir = dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  const contents = buffer.map((b) => JSON.stringify(b.entry)).join("\n");
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
