import { NextResponse } from "next/server";
import { archiveDraft } from "@/app/(workspace)/actions/archiveDraft";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = await archiveDraft(payload);
  return NextResponse.json(result);
}
