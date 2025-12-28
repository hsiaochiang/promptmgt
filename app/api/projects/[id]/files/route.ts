import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { extname, join } from "path";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { badRequest, notFound } from "@/app/api/_lib/responses";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";

const FILES_DIR = "_files";

async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

function safeFileName(original: string) {
  const ext = extname(original);
  const base = original.slice(0, ext.length ? -ext.length : undefined);
  const safeBase = sanitizeFilename(base);
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  return `${safeBase}${safeExt || ""}`;
}

async function resolveProjectFilesDir(projectId: string) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath ?? "";
  if (!rootPath) return badRequest("rootPath is not configured");

  const project = db.data!.projects.find((p) => p.id === projectId);
  if (!project) return notFound("Project not found");

  const safeProject = sanitizeFilename(project.name);
  return join(rootPath, safeProject, FILES_DIR);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const dirOrRes = await resolveProjectFilesDir(params.id);
  if (dirOrRes instanceof NextResponse) return dirOrRes;

  try {
    await ensureDir(dirOrRes);
    const entries = await fs.readdir(dirOrRes, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile())
        .map(async (e) => {
          const full = join(dirOrRes, e.name);
          const stat = await fs.stat(full);
          return {
            name: e.name,
            size: stat.size,
            mtimeMs: stat.mtimeMs
          };
        })
    );

    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    return NextResponse.json(files);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message ?? "Failed to list files" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const dirOrRes = await resolveProjectFilesDir(params.id);
  if (dirOrRes instanceof NextResponse) return dirOrRes;

  const form = await request.formData().catch(() => null);
  if (!form) return badRequest("invalid form data");

  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("file is required", { field: "file" });

  const rawName = file.name || `upload-${nanoid(6)}`;
  const safeName = safeFileName(rawName);
  await ensureDir(dirOrRes);

  const writePathBase = join(dirOrRes, safeName);
  const exists = await fs
    .stat(writePathBase)
    .then(() => true)
    .catch(() => false);
  const finalName = exists ? safeFileName(`${rawName}-${nanoid(4)}`) : safeName;
  const writePath = join(dirOrRes, finalName);

  const bytes = new Uint8Array(await file.arrayBuffer());
  await fs.writeFile(writePath, bytes);
  const stat = await fs.stat(writePath);

  return NextResponse.json({ name: finalName, size: stat.size, mtimeMs: stat.mtimeMs }, { status: 201 });
}
