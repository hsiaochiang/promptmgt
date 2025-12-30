import { NextResponse } from "next/server";
import { conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { ensureIsoUtc8, toIsoWithOffset } from "@/lib/utils/date";

function normalizeInboxItem(item: any) {
  return {
    ...item,
    createdAt: ensureIsoUtc8(item?.createdAt),
    updatedAt: ensureIsoUtc8(item?.updatedAt)
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return notFound("Draft not found");
  return NextResponse.json(normalizeInboxItem(draft));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return notFound("Draft not found");

  // Canonicalize timestamps to prevent false conflicts from legacy Z timestamps.
  draft.createdAt = ensureIsoUtc8((draft as any).createdAt);
  draft.updatedAt = ensureIsoUtc8((draft as any).updatedAt);

  const expectedUpdatedAt =
    payload.expectedUpdatedAt ?? payload.updatedAt ?? payload.clientUpdatedAt ?? null;

  if (expectedUpdatedAt && draft.updatedAt && draft.updatedAt !== expectedUpdatedAt) {
    return conflict("Draft has changed", { currentUpdatedAt: draft.updatedAt });
  }

  draft.title = payload.title ?? draft.title;
  draft.content = payload.content ?? draft.content;
  draft.hint = payload.hint ?? draft.hint;
  draft.updatedAt = toIsoWithOffset();
  await db.write();
  return NextResponse.json(normalizeInboxItem(draft));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const before = db.data!.inbox.length;
  db.data!.inbox = db.data!.inbox.filter((i) => i.id !== params.id);

  if (db.data!.inbox.length === before) {
    return notFound("Draft not found");
  }

  await db.write();
  return NextResponse.json({ ok: true });
}
