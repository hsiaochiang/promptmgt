import { NextResponse } from "next/server";
import { join } from "path";
import { nanoid } from "nanoid";
import { badRequest } from "@/app/api/_lib/responses";
import { listPrompts, writePrompt } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { promptFrontmatterSchema } from "@/lib/types/schema";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";
import { toIsoWithOffset } from "@/lib/utils/date";

export async function GET(request: Request) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath ?? process.env.DEFAULT_ROOT ?? "";
  if (!rootPath) {
    setPromptMetaFromPrompts([]);
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");
  const promptStage = searchParams.get("promptStage");
  const platformTag = searchParams.get("platformTag");
  const tag = searchParams.get("tag");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "1000", 10) || 1000, 1000);
  const all = await listPrompts(rootPath);
  setPromptMetaFromPrompts(all);
  let filtered = projectId
    ? all.filter((p) => p.projectId === projectId || p.project === projectId)
    : all;

  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (category) {
    filtered = filtered.filter((p) => p.category?.code === category || p.category?.name === category);
  }

  if (promptStage) {
    filtered = filtered.filter(
      (p) => p.promptStage?.code === promptStage || p.promptStage?.name === promptStage
    );
  }

  if (platformTag) {
    filtered = filtered.filter((p) =>
      (p.platformTags ?? []).some((t) => t.code === platformTag || t.name === platformTag)
    );
  }

  if (tag) {
    filtered = filtered.filter((p) => (p.tags ?? []).some((t) => t.code === tag || t.name === tag));
  }

  if (query.trim()) {
    filtered = filtered.filter((p) => {
      const tagText = (p.tags ?? []).map((t) => `${t.code} ${t.name}`).join(" ");
      const platformText = (p.platformTags ?? []).map((t) => `${t.code} ${t.name}`).join(" ");
      return [p.title, p.model, tagText, platformText]
        .filter(Boolean)
        .some((field) => (field ?? "").toLowerCase().includes(query));
    });
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

  const normalizedFrontmatter: PromptFrontmatter = (() => {
    const now = toIsoWithOffset();
    const raw: PromptFrontmatter = {
      title: frontmatter?.title ?? "",
      project: frontmatter?.project ?? "",
      type: frontmatter?.type ?? "其他",
      status: frontmatter?.status ?? "草稿",
      model: frontmatter?.model ?? "",
      tags: Array.isArray(frontmatter?.tags) ? frontmatter.tags : [],
      note: frontmatter?.note,
      updatedAt: now,
      createdAt: frontmatter?.createdAt ?? now
    };
    try {
      return promptFrontmatterSchema.parse(raw);
    } catch (err: any) {
      return badRequest("frontmatter.title and project are required", { issues: err?.issues });
    }
  })() as PromptFrontmatter;

  if (normalizedFrontmatter instanceof NextResponse) return normalizedFrontmatter;

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
      path: rootPath ? `${rootPath}/${safeProject}` : undefined,
      docPath: join(rootPath ?? "", "Prompts", safeProject, "README.md")
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
