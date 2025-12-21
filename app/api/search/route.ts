import { NextResponse } from "next/server";
import { searchPrompts } from "@/lib/services/search";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const projectId = searchParams.get("projectId") || undefined;
  const status = searchParams.get("status") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "1000", 10) || 1000, 1000);
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;
  if (!rootPath) return NextResponse.json([]);
  const prompts = await listPrompts(rootPath);
  const results = searchPrompts(prompts, query, limit, { projectId, status: status ?? undefined });
  return NextResponse.json(results);
}
