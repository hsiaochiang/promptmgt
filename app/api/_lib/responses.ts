import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ConflictDetails {
  currentHash?: string;
  currentMtime?: number;
  currentUpdatedAt?: string;
  field?: string;
}

function normalizeConflictDetails(details?: unknown): ConflictDetails | undefined {
  if (!details || typeof details !== "object") return details as ConflictDetails | undefined;
  const payload = details as Record<string, unknown>;
  const normalized: ConflictDetails = {};
  if (typeof payload.currentHash === "string") normalized.currentHash = payload.currentHash;
  if (typeof payload.currentMtime === "number") normalized.currentMtime = payload.currentMtime;
  if (typeof payload.currentUpdatedAt === "string") normalized.currentUpdatedAt = payload.currentUpdatedAt;
  if (typeof payload.field === "string") normalized.field = payload.field;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function safeMessage(message: unknown, fallback: string) {
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { code, message: safeMessage(message, code.replace(/_/g, " ")), details: details ?? undefined },
    { status }
  );
}

export function badRequest(message: string, details?: unknown) {
  return apiError(400, "bad_request", message, details);
}

export function notFound(message = "Not Found", details?: unknown) {
  return apiError(404, "not_found", message, details);
}

export function conflict(message = "Conflict", details?: unknown) {
  return apiError(409, "conflict", message, normalizeConflictDetails(details));
}

export function unauthorized(message = "Unauthorized", details?: unknown) {
  return apiError(401, "unauthorized", message, details);
}

export function serverError(message = "Internal Server Error", details?: unknown) {
  return apiError(500, "internal_error", message, details);
}

export function success(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init);
}
