import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import { getDb } from "@/lib/db";
import { badRequest, notFound } from "@/app/api/_lib/responses";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

const FILES_DIR = "_files";

async function resolveProjectFilesDir(projectId: string) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath ?? "";
  if (!rootPath) return badRequest("rootPath is not configured");

  const project = db.data!.projects.find((p) => p.id === projectId);
  if (!project) return notFound("Project not found");

  const safeProject = sanitizeFilename(project.name);
  return join(rootPath, safeProject, FILES_DIR);
}

function safeSegment(input: string) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "";
  // Keep extension, but sanitize the basename.
  const parts = trimmed.split(".");
  if (parts.length <= 1) return sanitizeFilename(trimmed);
  const ext = parts.pop() as string;
  const base = parts.join(".");
  return `${sanitizeFilename(base)}.${ext.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export async function GET(_: Request, { params }: { params: { id: string; name: string } }) {
  const dirOrRes = await resolveProjectFilesDir(params.id);
  if (dirOrRes instanceof NextResponse) return dirOrRes;

  const name = safeSegment(params.name);
  if (!name) return badRequest("name is required");

  const full = join(dirOrRes, name);
  const exists = await fs
    .stat(full)
    .then((s) => (s.isFile() ? true : false))
    .catch(() => false);
  if (!exists) return notFound("File not found");

  const buffer = await fs.readFile(full);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
    }
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string; name: string } }) {
  const dirOrRes = await resolveProjectFilesDir(params.id);
  if (dirOrRes instanceof NextResponse) return dirOrRes;

  const name = safeSegment(params.name);
  if (!name) return badRequest("name is required");

  const full = join(dirOrRes, name);
  const exists = await fs
    .stat(full)
    .then((s) => (s.isFile() ? true : false))
    .catch(() => false);
  if (!exists) return notFound("File not found");

  await fs.rm(full, { force: true });
  return NextResponse.json({ ok: true });
}
