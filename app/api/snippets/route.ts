import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

function normalizeName(name?: string) {
  return name?.trim().toLowerCase();
}

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data!.snippets);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = await getDb();

  const name = payload.name?.trim() || "新片語";
  const conflict = db.data!.snippets.find((s) => normalizeName(s.name) === normalizeName(name));
  if (conflict) {
    return NextResponse.json({ message: "snippet name already exists" }, { status: 409 });
  }

  const snippet = {
    id: payload.id ?? `snip-${nanoid(6)}`,
    name,
    category: payload.category?.trim() || "其他",
    content: payload.content ?? "",
    usage: 0,
    lastUsedAt: undefined
  };

  db.data!.snippets.push(snippet);
  await db.write();
  return NextResponse.json(snippet, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { id, name, category, content } = payload;

  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const db = await getDb();
  const snippet = db.data!.snippets.find((s) => s.id === id);
  if (!snippet) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  if (name !== undefined) {
    const nextName = name.trim();
    const conflict = db.data!.snippets.find((s) => s.id !== id && normalizeName(s.name) === normalizeName(nextName));
    if (conflict) {
      return NextResponse.json({ message: "snippet name already exists" }, { status: 409 });
    }
    snippet.name = nextName || snippet.name;
  }

  if (category !== undefined) snippet.category = category.trim() || snippet.category;
  if (content !== undefined) snippet.content = content;

  await db.write();
  return NextResponse.json(snippet);
}

export async function DELETE(request: Request) {
  const payload = await request.json();
  const { id } = payload;

  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const db = await getDb();
  const existing = db.data!.snippets.find((s) => s.id === id);
  if (!existing) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  db.data!.snippets = db.data!.snippets.filter((s) => s.id !== id);
  await db.write();
  return NextResponse.json({ ok: true });
}
