import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const snippet = db.data!.snippets.find((s) => s.id === params.id);
  if (!snippet) return NextResponse.json({ message: "Not Found" }, { status: 404 });
  snippet.usage += 1;
  snippet.lastUsedAt = new Date().toISOString();
  await db.write();
  return NextResponse.json(snippet);
}
