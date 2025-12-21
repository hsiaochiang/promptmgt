import { NextResponse } from "next/server";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ code, message, details }, { status });
}

export function badRequest(message: string, details?: unknown) {
  return apiError(400, "bad_request", message, details);
}

export function notFound(message = "Not Found", details?: unknown) {
  return apiError(404, "not_found", message, details);
}

export function conflict(message = "Conflict", details?: unknown) {
  return apiError(409, "conflict", message, details);
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
