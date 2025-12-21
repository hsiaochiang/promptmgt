import { NextResponse } from "next/server";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";

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

function inflate(snippet: any) {
  return {
    ...snippet,
    usageCount: toUsageCount(snippet),
    usage: toUsageCount(snippet)
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const snippet = db.data!.snippets.find((s) => s.id === params.id);
  if (!snippet) return notFound("Snippet not found");
  return NextResponse.json(inflate(snippet));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const snippet = db.data!.snippets.find((s) => s.id === params.id);
  if (!snippet) return notFound("Snippet not found");

  const payload = await request.json();
  const { name, category, content } = payload;

  if (name !== undefined) {
    const nextName = name.trim();
    if (!nextName) {
      return badRequest("name is required", { field: "name" });
    }
    const conflict = db.data!.snippets.find(
      (s) => s.id !== params.id && normalizeName(s.name) === normalizeName(nextName)
    );
    if (conflict) {
      return conflictResponse();
    }
    snippet.name = nextName;
  }

  if (category !== undefined) {
    snippet.category = category.trim() || snippet.category;
  }

  if (content !== undefined) {
    snippet.content = typeof content === "string" ? content : snippet.content;
  }

  await db.write();
  return NextResponse.json(inflate(snippet));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const exists = db.data!.snippets.some((s) => s.id === params.id);
  if (!exists) return notFound("Snippet not found");
  db.data!.snippets = db.data!.snippets.filter((s) => s.id !== params.id);
  await db.write();
  return NextResponse.json({ ok: true });
}
