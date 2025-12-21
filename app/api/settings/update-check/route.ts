import { NextResponse } from "next/server";
import { checkForUpdates } from "@/lib/services/telemetry";
import pkg from "@/package.json";

export async function GET() {
  const endpoint = process.env.UPDATE_CHECK_ENDPOINT;
  const result = await checkForUpdates(pkg.version, { endpoint });
  return NextResponse.json(result);
}
