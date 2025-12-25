import { createHash, randomUUID } from "crypto";

export function computeHash(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export type ConflictReason = "mtime" | "hash";
export type ConflictDecision = "load-external" | "keep-local" | "view-diff";
export type ConflictSource = "save" | "watcher";

export interface ConflictCheck {
  localMtime: number;
  externalMtime: number;
  localHash?: string;
  externalHash?: string;
  detectedAtMs?: number;
}

export interface ConflictCheckResult {
  conflict: boolean;
  reasons: ConflictReason[];
  local: { mtime: number; hash?: string };
  external: { mtime: number; hash?: string };
}

export interface ConflictEventContext {
  filePath?: string;
  projectId?: string;
  promptId?: string;
}

export interface ConflictEvent {
  id: string;
  decision: ConflictDecision;
  timestamp: string;
  reasons: ConflictReason[];
  hashes: { local?: string; external?: string };
  mtimes: { local: number; external: number };
  context?: ConflictEventContext;
  source?: ConflictSource;
  notifyBy?: string;
}

export function detectConflict(params: ConflictCheck): ConflictCheckResult {
  const reasons: ConflictReason[] = [];
  const timeConflict = params.externalMtime > params.localMtime;
  if (timeConflict) reasons.push("mtime");

  const hashConflict =
    params.localHash && params.externalHash ? params.localHash !== params.externalHash : false;
  if (hashConflict) reasons.push("hash");

  return {
    conflict: reasons.length > 0,
    reasons,
    local: { mtime: params.localMtime, hash: params.localHash },
    external: { mtime: params.externalMtime, hash: params.externalHash }
  };
}

export function hasConflict(params: ConflictCheck) {
  return detectConflict(params).conflict;
}

export function createConflictEvent(
  result: ConflictCheckResult,
  decision: ConflictDecision,
  context: ConflictEventContext = {},
  source: ConflictSource = "save",
  detectedAt: number | Date = Date.now()
): ConflictEvent {
  const detectedMs = typeof detectedAt === "number" ? detectedAt : detectedAt.getTime();
  return {
    id: randomUUID(),
    decision,
    timestamp: new Date(detectedMs).toISOString(),
    reasons: result.reasons,
    hashes: { local: result.local.hash, external: result.external.hash },
    mtimes: { local: result.local.mtime, external: result.external.mtime },
    context,
    source,
    notifyBy: new Date(detectedMs + 5000).toISOString()
  };
}

export function createWatcherConflictEvent(
  params: ConflictCheck,
  context: ConflictEventContext = {}
): ConflictEvent {
  const result = detectConflict(params);
  return createConflictEvent(result, "view-diff", context, "watcher", params.detectedAtMs ?? Date.now());
}

export function shouldNotifyWithinFiveSeconds(event: ConflictEvent, now: number = Date.now()) {
  if (!event.notifyBy) return true;
  return new Date(event.notifyBy).getTime() - now <= 5000;
}
