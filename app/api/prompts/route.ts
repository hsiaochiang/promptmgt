import { NextResponse } from "next/server";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;
  if (!rootPath) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const all = await listPrompts(rootPath);
  const filtered = projectId ? all.filter((p) => p.projectId === projectId) : all;
  return NextResponse.json(filtered);
}
