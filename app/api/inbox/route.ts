import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";

function now() {
  return new Date().toISOString();
}

export async function GET() {
  const db = await getDb();
  const inbox = [...db.data!.inbox].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return NextResponse.json(inbox);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = await getDb();
  const newItem = {
    id: `inbox-${nanoid(8)}`,
    title: payload.title ?? "新草稿",
    content: payload.content ?? "",
    hint: payload.hint ?? "",
    createdAt: now(),
    updatedAt: now()
  };
  db.data!.inbox.push(newItem);
  await db.write();
  return NextResponse.json(newItem, { status: 201 });
}
