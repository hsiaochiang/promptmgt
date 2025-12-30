import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { getInboxPageSize } from "@/lib/utils/config";
import { ensureIsoUtc8, toIsoWithOffset } from "@/lib/utils/date";

function normalizeInboxItem(item: any) {
  return {
    ...item,
    createdAt: ensureIsoUtc8(item?.createdAt),
    updatedAt: ensureIsoUtc8(item?.updatedAt)
  };
}

export async function GET(request: Request) {
  const db = await getDb();
  const { searchParams } = new URL(request.url ?? "http://localhost/api/inbox");

  const pageSize = getInboxPageSize();

  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : pageSize;
  const offset = Number.isFinite(offsetParam) && offsetParam > 0 ? offsetParam : 0;

  let inbox = [...db.data!.inbox]
    .map(normalizeInboxItem)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (query) {
    inbox = inbox.filter((item) => {
      const haystack = `${item.title ?? ""} ${item.hint ?? ""} ${item.content ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  const total = inbox.length;

  const items = inbox.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  return NextResponse.json({ items, total, hasMore, limit, offset });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const db = await getDb();
  const now = toIsoWithOffset();
  const newItem = {
    id: `inbox-${nanoid(8)}`,
    title: payload.title ?? "新草稿",
    content: payload.content ?? "",
    hint: payload.hint ?? "",
    createdAt: now,
    updatedAt: now
  };
  db.data!.inbox.push(newItem);
  await db.write();
  return NextResponse.json(normalizeInboxItem(newItem), { status: 201 });
}
