import { NextResponse } from "next/server";
import { notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { ensureIsoUtc8, toIsoWithOffset } from "@/lib/utils/date";

function normalizeTimestamps(snippet: any) {
  return {
    ...snippet,
    createdAt: ensureIsoUtc8(snippet?.createdAt),
    updatedAt: ensureIsoUtc8(snippet?.updatedAt),
    lastUsedAt: snippet?.lastUsedAt ? ensureIsoUtc8(snippet.lastUsedAt) : undefined
  };
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const snippet = db.data!.snippets.find((s) => s.id === params.id);
  if (!snippet) return notFound("Snippet not found");
  const current = typeof snippet.usageCount === "number" ? snippet.usageCount : snippet.usage ?? 0;
  const nextCount = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
  snippet.usage = nextCount;
  snippet.usageCount = nextCount;
  const now = toIsoWithOffset();
  snippet.lastUsedAt = now;
  snippet.updatedAt = now;
  await db.write();
  return NextResponse.json(normalizeTimestamps(snippet));
}
