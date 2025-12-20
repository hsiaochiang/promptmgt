import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/services/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const updated = await updateSettings(payload);
  return NextResponse.json(updated);
}
