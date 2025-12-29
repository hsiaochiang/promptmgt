import { NextResponse } from "next/server";
import { sendTelemetry } from "@/lib/services/telemetry";
import { badRequest, success } from "@/app/api/_lib/responses";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = typeof body.event === "string" && body.event.trim().length > 0 ? body.event : null;
  if (!event) {
    return badRequest("event is required", { field: "event" });
  }

  const timestamp =
    typeof body.timestamp === "string" && body.timestamp.trim().length > 0
      ? body.timestamp
      : new Date().toISOString();

  const result = await sendTelemetry({ ...body, event, timestamp });
  return success({ ok: true, result });
}
