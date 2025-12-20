import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";

function now() {
  return new Date().toISOString();
}

export async function GET(request: Request) {
  const db = await getDb();
  const { searchParams } = new URL(request.url ?? "http://localhost/api/inbox");

  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : undefined;
  const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;

  let inbox = [...db.data!.inbox].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (query) {
    inbox = inbox.filter((item) => {
      const haystack = `${item.title ?? ""} ${item.hint ?? ""} ${item.content ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  const total = inbox.length;

  if (limit) {
    const items = inbox.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    return NextResponse.json({ items, total, hasMore, limit, offset });
  }

  return NextResponse.json({ items: inbox, total, hasMore: false, limit: total, offset: 0 });
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
