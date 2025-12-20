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

export function sanitizeTelemetryPayload(input: Record<string, unknown>): TelemetryPayload | null {
  if (Object.keys(input).some((key) => FORBIDDEN_KEYS.some((k) => key.toLowerCase().includes(k)))) {
    return null;
  }

  const output: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (!ALLOWED_ROOT_KEYS.has(key)) continue;
    const value = input[key];
    if (value === undefined) continue;
    output[key] = value;
  }

  if (!output.event || !output.timestamp) return null;
  return output as TelemetryPayload;
}

interface SendOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
}

export async function sendTelemetry(payload: Record<string, unknown>, options: SendOptions = {}) {
  const settings = await getSettings();
  const telemetryEnabled = settings.telemetryEnabled ?? true;
  if (!telemetryEnabled) {
    return { skipped: true, reason: "disabled" } as const;
  }

  const sanitized = sanitizeTelemetryPayload(payload);
  if (!sanitized) return { skipped: true, reason: "blocked" } as const;

  const endpoint = options.endpoint ?? "https://telemetry.local/collect";
  if (!endpoint.startsWith("https://")) {
    return { skipped: true, reason: "insecure-endpoint" } as const;
  }

  const doFetch = options.fetcher ?? fetch;
  try {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitized)
    });
    return { ok: res.ok, status: res.status } as const;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" } as const;
  }
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

  const endpoint = options.endpoint ?? `https://updates.local/check?current=${encodeURIComponent(currentVersion)}`;
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
