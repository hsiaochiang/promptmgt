import { createHash, randomUUID } from "crypto";

export function computeHash(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export type ConflictReason = "mtime" | "hash";
export type ConflictDecision = "load-external" | "keep-local" | "view-diff";

export interface ConflictCheck {
  localMtime: number;
  externalMtime: number;
  localHash?: string;
  externalHash?: string;
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
  context: ConflictEventContext = {}
): ConflictEvent {
  return {
    id: randomUUID(),
    decision,
    timestamp: new Date().toISOString(),
    reasons: result.reasons,
    hashes: { local: result.local.hash, external: result.external.hash },
    mtimes: { local: result.local.mtime, external: result.external.mtime },
    context
  };
}
