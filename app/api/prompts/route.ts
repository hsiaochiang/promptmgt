import { NextResponse } from "next/server";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";
import { setPromptMetaFromPrompts } from "@/lib/services/cache";

export async function GET(request: Request) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;
  if (!rootPath) {
    setPromptMetaFromPrompts([]);
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const all = await listPrompts(rootPath);
  setPromptMetaFromPrompts(all);
  const filtered = projectId ? all.filter((p) => p.projectId === projectId) : all;
  return NextResponse.json(filtered);
}
