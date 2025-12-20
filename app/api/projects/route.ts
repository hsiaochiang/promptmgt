import { promises as fs } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
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
  const db = await getDb();
  const project = {
    id: payload.id ?? `proj-${nanoid(6)}`,
    name: payload.name,
    status: payload.status ?? "規劃中",
    promptCount: 0,
    updatedAt: now(),
    lastSyncedAt: now()
  };
  db.data!.projects.push(project);
  await db.write();
  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await request.json();
  const { id, status, name, promptCount } = payload;

  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const db = await getDb();
  const project = db.data!.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  if (status) project.status = status;
  if (name) project.name = name;
  if (typeof promptCount === "number") project.promptCount = promptCount;
  project.updatedAt = now();
  project.lastSyncedAt = now();

  await db.write();
  return NextResponse.json(project);
}

export async function DELETE(request: Request) {
  const payload = await request.json();
  const { id } = payload;

  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const db = await getDb();
  const existing = db.data!.projects.find((p) => p.id === id);
  if (!existing) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
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
