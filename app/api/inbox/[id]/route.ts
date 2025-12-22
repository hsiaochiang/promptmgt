import { NextResponse } from "next/server";
import { conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { toIsoWithOffset } from "@/lib/utils/date";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return notFound("Draft not found");
  return NextResponse.json(draft);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return notFound("Draft not found");

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
  return NextResponse.json(draft);
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
