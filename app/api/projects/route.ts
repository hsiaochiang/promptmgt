import { promises as fs } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";
import { listPrompts } from "@/lib/fs/prompts";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

function now() {
  return new Date().toISOString();
}

export async function GET() {
  const db = await getDb();
  const projects = db.data!.projects;
  return NextResponse.json(applyPromptMeta(projects));
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
  const createdAt = now();
  const project = {
    id: payload.id ?? `proj-${nanoid(6)}`,
    name,
    status: payload.status ?? "規劃中",
    promptCount: 0,
    updatedAt: createdAt,
    createdAt,
    path: rootPath ? join(rootPath, sanitizeFilename(name)) : undefined
  };
  db.data!.projects.push(project);
  await db.write();
  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { id, status, name, promptCount } = payload;

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

  if (status) project.status = status;
  if (typeof promptCount === "number") project.promptCount = promptCount;
  project.updatedAt = now();

  const rootPath = db.data!.settings.rootPath ?? "";
  if (rootPath && project.name) {
    project.path = join(rootPath, sanitizeFilename(project.name));
  }

  await db.write();
  return NextResponse.json(project);
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
