import { NextResponse } from "next/server";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";
import { promises as fs } from "fs";
import { setPromptMetaFromPrompts, getPromptMeta } from "@/lib/services/cache";
import { writePrompt } from "@/lib/fs/prompts";
import { serializePrompt } from "@/lib/utils/frontmatter";
import { computeHash } from "@/lib/services/conflict";
import type { PromptFrontmatter } from "@/lib/types/schema";

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
  const filtered = projectId
    ? all.filter((p) => p.projectId === projectId || p.project === projectId)
    : all;
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { frontmatter, body } = payload as { frontmatter: PromptFrontmatter; body?: string };

  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;

  if (!rootPath) {
    return NextResponse.json({ message: "rootPath is not configured" }, { status: 400 });
  }

  if (!frontmatter?.title || !frontmatter?.project) {
    return NextResponse.json({ message: "frontmatter.title and project are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const fm = { ...frontmatter, updatedAt: frontmatter.updatedAt ?? now };

  const filePath = await writePrompt(rootPath, fm.project, fm, body ?? "");
  const content = serializePrompt(fm, body ?? "");
  const stat = await fs.stat(filePath);
  const id = Buffer.from(filePath, "utf8").toString("base64url");

  const project = db.data!.projects.find((p) => p.name === fm.project);
  if (project) {
    project.promptCount = (project.promptCount ?? 0) + 1;
    project.updatedAt = fm.updatedAt;
    await db.write();
  }

  const all = await listPrompts(rootPath);
  setPromptMetaFromPrompts(all);
  const meta = getPromptMeta(fm.project);
  if (project && meta) {
    project.promptCount = meta.promptCount;
    project.updatedAt = meta.updatedAt ?? project.updatedAt;
    await db.write();
  }

  return NextResponse.json(
    {
      id,
      projectId: fm.project,
      frontmatter: fm,
      body: body ?? "",
      hash: computeHash(content),
      mtimeMs: stat.mtimeMs
    },
    { status: 201 }
  );
}
