import { NextResponse } from "next/server";
import { searchPrompts } from "@/lib/services/search";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;
  if (!rootPath) return NextResponse.json([]);
  const prompts = await listPrompts(rootPath);
  const results = searchPrompts(prompts, query);
  return NextResponse.json(results);
}
