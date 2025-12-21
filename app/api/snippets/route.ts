import { NextResponse } from "next/server";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

function normalizeName(name?: string) {
  return name?.trim().toLowerCase();
}

function conflictResponse() {
  return conflict("snippet name already exists");
}

function toUsageCount(snippet: any) {
  const current = typeof snippet.usageCount === "number" ? snippet.usageCount : snippet.usage ?? 0;
  return Number.isFinite(current) && current >= 0 ? current : 0;
}

export async function GET(request?: Request) {
  const db = await getDb();
  const url = request ? new URL(request.url) : new URL("http://localhost/api/snippets");
  const keyword = url.searchParams.get("q")?.toLowerCase().trim();
  const snippets = db.data!.snippets.filter((snippet) => {
    if (!keyword) return true;
    const haystack = `${snippet.name}${snippet.category}${snippet.content}`.toLowerCase();
    return haystack.includes(keyword);
  });
  return NextResponse.json(
    snippets.map((snippet) => ({
      ...snippet,
      usageCount: toUsageCount(snippet),
      usage: toUsageCount(snippet)
    }))
  );
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = await getDb();

  const rawName = payload.name?.trim();
  if (!rawName) {
    return badRequest("name is required", { field: "name" });
  }

  const name = rawName;
  const category = payload.category?.trim() || "其他";
  const content = typeof payload.content === "string" ? payload.content : "";
  const hasConflict = db.data!.snippets.find((s) => normalizeName(s.name) === normalizeName(name));
  if (hasConflict) {
    return conflictResponse();
  }

  const snippet = {
    id: payload.id ?? `snip-${nanoid(6)}`,
    name,
    category,
    content,
    usage: 0,
    usageCount: 0,
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
    return badRequest("id is required", { field: "id" });
  }
  const db = await getDb();
  const target = db.data!.snippets.find((s) => s.id === id);
  if (!target) return notFound("Snippet not found");

  if (name !== undefined) {
    const nextName = name.trim();
    if (!nextName) return badRequest("name is required", { field: "name" });
    const conflict = db.data!.snippets.find((s) => s.id !== id && normalizeName(s.name) === normalizeName(nextName));
    if (conflict) return conflictResponse();
    target.name = nextName;
  }
  if (category !== undefined) target.category = category.trim() || target.category;
  if (content !== undefined) target.content = typeof content === "string" ? content : target.content;
  await db.write();
  return NextResponse.json({ ...target, usageCount: toUsageCount(target), usage: toUsageCount(target) });
}

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const { id } = payload as { id?: string };
  if (!id) {
    return badRequest("id is required", { field: "id" });
  }
  const db = await getDb();
  const exists = db.data!.snippets.some((s) => s.id === id);
  if (!exists) return notFound("Snippet not found");
  db.data!.snippets = db.data!.snippets.filter((s) => s.id !== id);
  await db.write();
  return NextResponse.json({ ok: true });
}
