import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { badRequest } from "@/app/api/_lib/responses";
import { listPrompts, writePrompt } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

function now() {
  return new Date().toISOString();
}

export async function GET(request: Request) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;
  if (!rootPath) {
    setPromptMetaFromPrompts([]);
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "1000", 10) || 1000, 1000);
  const all = await listPrompts(rootPath);
  setPromptMetaFromPrompts(all);
  let filtered = projectId
    ? all.filter((p) => p.projectId === projectId || p.project === projectId)
    : all;

  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (query.trim()) {
    filtered = filtered.filter((p) =>
      [p.title, p.model, p.tags.join(" ")].some((field) => (field ?? "").toLowerCase().includes(query))
    );
  }

  filtered = filtered.slice(0, limit);
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { frontmatter, body } = payload as { frontmatter: PromptFrontmatter; body?: string };

  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;

  if (!rootPath) {
    return badRequest("rootPath is not configured");
  }

  const errors: string[] = [];
  if (!frontmatter?.title) errors.push("title");
  if (!frontmatter?.project) errors.push("project");
  if (errors.length > 0) {
    return badRequest("frontmatter.title and project are required", { missing: errors });
  }

  const normalizedFrontmatter: PromptFrontmatter = {
    ...frontmatter,
    title: frontmatter.title.trim(),
    project: frontmatter.project.trim(),
    updatedAt: frontmatter.updatedAt ?? now(),
    createdAt: frontmatter.createdAt ?? now(),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : []
  };

  const safeProject = sanitizeFilename(normalizedFrontmatter.project);
  const projectExists = db.data!.projects.find(
    (p) => p.name.toLowerCase() === normalizedFrontmatter.project.toLowerCase()
  );

  if (!projectExists) {
    db.data!.projects.push({
      id: `proj-${nanoid(6)}`,
      name: normalizedFrontmatter.project,
      status: "進行中",
      promptCount: 0,
      createdAt: normalizedFrontmatter.createdAt,
      updatedAt: normalizedFrontmatter.updatedAt,
      path: rootPath ? `${rootPath}/${safeProject}` : undefined
    });
  }

  const { filePath, hash, mtimeMs } = await writePrompt(rootPath, normalizedFrontmatter.project, normalizedFrontmatter, body ?? "");
  const id = Buffer.from(filePath, "utf8").toString("base64url");

  const all = await listPrompts(rootPath);
  setPromptMetaFromPrompts(all);
  db.data!.projects = applyPromptMeta(db.data!.projects);
  await db.write();

  return NextResponse.json(
    {
      id,
      projectId: normalizedFrontmatter.project,
      frontmatter: normalizedFrontmatter,
      body: body ?? "",
      hash,
      mtimeMs
    },
    { status: 201 }
  );
}
