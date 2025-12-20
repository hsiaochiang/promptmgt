import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function now() {
  return new Date().toISOString();
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return NextResponse.json({ message: "Not Found" }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === params.id);
  if (!draft) return NextResponse.json({ message: "Not Found" }, { status: 404 });

  draft.title = payload.title ?? draft.title;
  draft.content = payload.content ?? draft.content;
  draft.hint = payload.hint ?? draft.hint;
  draft.updatedAt = now();
  await db.write();
  return NextResponse.json(draft);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  db.data!.inbox = db.data!.inbox.filter((i) => i.id !== params.id);
  await db.write();
  return NextResponse.json({ ok: true });
}
