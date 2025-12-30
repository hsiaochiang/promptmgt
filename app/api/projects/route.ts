import { promises as fs } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";
import { listPrompts } from "@/lib/fs/prompts";
import { writeProjectReadme } from "@/lib/fs/projects";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";
import { ensureIsoUtc8, toIsoWithOffset } from "@/lib/utils/date";
import { projectStatuses, projectTypes } from "@/lib/taxonomy/data";
import { normalizeTaxonomyArray, normalizeTaxonomyValue, toTaxonomyTable } from "@/lib/utils/taxonomy";

const statusTable = toTaxonomyTable(projectStatuses);
const projectTypeTable = toTaxonomyTable(projectTypes);

function normalizeProjectOutput(project: any) {
  return {
    ...project,
    summary: typeof project.summary === "string" && project.summary.trim() ? project.summary.trim() : "未設定",
    status: normalizeTaxonomyValue(project.status ?? projectStatuses[0], statusTable),
    projectType: project.projectType
      ? normalizeTaxonomyValue(project.projectType, projectTypeTable)
      : normalizeTaxonomyValue(projectTypes[0], projectTypeTable),
    tags: normalizeTaxonomyArray(project.tags ?? [], undefined),
    createdAt: ensureIsoUtc8(project.createdAt),
    updatedAt: ensureIsoUtc8(project.updatedAt)
  };
}

export async function GET(request?: Request) {
  const db = await getDb();
  const url = request ? new URL(request.url) : new URL("http://localhost/api/projects");
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const projectType = url.searchParams.get("projectType")?.trim() ?? "";
  const tag = url.searchParams.get("tag")?.trim() ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "1000", 10) || 1000, 1000);

  const projects = applyPromptMeta(db.data!.projects).map(normalizeProjectOutput);
  const filtered = projects
    .filter((p: any) => {
      if (!q) return true;
      const haystack = `${p.name ?? ""} ${p.summary ?? ""}`.toLowerCase();
      return haystack.includes(q);
    })
    .filter((p: any) => {
      if (!status) return true;
      return p.status?.code === status || p.status?.name === status;
    })
    .filter((p: any) => {
      if (!projectType) return true;
      return p.projectType?.code === projectType || p.projectType?.name === projectType;
    })
    .filter((p: any) => {
      if (!tag) return true;
      return (p.tags ?? []).some((t: any) => t?.code === tag || t?.name === tag);
    })
    .slice(0, limit);

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    return badRequest("name is required", { field: "name" });
  }

  const db = await getDb();
  const exists = db.data!.projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return conflict("Project name already exists", { field: "name" });
  }

  const rootPath = db.data!.settings.rootPath ?? "";
  const createdAt = toIsoWithOffset();
  const safeName = sanitizeFilename(name);
  const summaryInput =
    typeof payload.summary === "string"
      ? payload.summary.trim()
      : typeof payload.description === "string"
        ? payload.description.trim()
        : "";
  const summary = summaryInput ? summaryInput.slice(0, 200) : "未設定";
  const project = {
    id: payload.id ?? `proj-${nanoid(6)}`,
    name,
    status: normalizeTaxonomyValue(payload.status ?? projectStatuses[0], statusTable),
    summary,
    projectType: normalizeTaxonomyValue(payload.projectType ?? projectTypes[0], projectTypeTable),
    tags: normalizeTaxonomyArray(payload.tags ?? [], undefined),
    promptCount: 0,
    updatedAt: createdAt,
    createdAt,
    path: rootPath ? join(rootPath, safeName) : undefined,
    docPath: join(rootPath, "Prompts", safeName, "README.md")
  };
  if (rootPath) {
    const result = await writeProjectReadme({
      docPath: project.docPath,
      rootPath,
      projectName: project.name,
      content: payload.description ? `# ${project.name}\n\n${payload.description}` : `# ${project.name}\n`
    });
    project.docPath = result.path;
  }
  db.data!.projects.push(project);
  await db.write();
  return NextResponse.json(normalizeProjectOutput(project), { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { id, status, name, promptCount, summary, projectType, tags } = payload;

  if (!id) {
    return badRequest("id is required", { field: "id" });
  }

  const db = await getDb();
  const project = db.data!.projects.find((p) => p.id === id);
  if (!project) {
    return notFound("Project not found");
  }

  if (name) {
    const trimmed = name.trim();
    if (!trimmed) return badRequest("name is required", { field: "name" });
    const dup = db.data!.projects.find((p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase());
    if (dup) {
      return conflict("Project name already exists", { field: "name" });
    }
    project.name = trimmed;
  }

  if (status) project.status = normalizeTaxonomyValue(status, statusTable);
  if (typeof summary === "string") {
    const trimmed = summary.trim();
    project.summary = trimmed ? trimmed.slice(0, 200) : project.summary;
  }
  if (projectType) project.projectType = normalizeTaxonomyValue(projectType, projectTypeTable);
  if (tags !== undefined) project.tags = normalizeTaxonomyArray(tags, undefined);
  if (typeof promptCount === "number") project.promptCount = promptCount;
  project.updatedAt = toIsoWithOffset();

  const rootPath = db.data!.settings.rootPath ?? "";
  if (rootPath && project.name) {
    const safe = sanitizeFilename(project.name);
    project.path = join(rootPath, safe);
    project.docPath = join(rootPath, "Prompts", safe, "README.md");
  }

  await db.write();
  return NextResponse.json(normalizeProjectOutput(project));
}

export async function DELETE(request: Request) {
  const payload = await request.json();
  const { id } = payload;

  if (!id) {
    return badRequest("id is required", { field: "id" });
  }

  const db = await getDb();
  const existing = db.data!.projects.find((p) => p.id === id);
  if (!existing) {
    return notFound("Project not found");
  }

  db.data!.projects = db.data!.projects.filter((p) => p.id !== id);

  const rootPath = db.data!.settings.rootPath;
  if (rootPath) {
    const projectDir = join(rootPath, sanitizeFilename(existing.name));
    await fs.rm(projectDir, { recursive: true, force: true });

    const prompts = await listPrompts(rootPath);
    setPromptMetaFromPrompts(prompts);
    db.data!.projects = applyPromptMeta(db.data!.projects);
  }

  await db.write();

  return NextResponse.json({ ok: true });
}
