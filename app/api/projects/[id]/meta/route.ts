import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { getDb } from "@/lib/db";
import { badRequest, notFound } from "@/app/api/_lib/responses";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";
import { toIsoWithOffset } from "@/lib/utils/date";

const META_FILE = "_meta.json";

type ProjectMeta = {
  category?: string;
  stage?: string;
  platforms?: string[];
  deliverables?: string[];
  audiences?: string[];
  commonTags?: string[];
  updatedAt?: string;
};

async function resolveMetaPath(projectId: string) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath ?? "";
  if (!rootPath) return badRequest("rootPath is not configured");

  const project = db.data!.projects.find((p) => p.id === projectId);
  if (!project) return notFound("Project not found");

  const safeProject = sanitizeFilename(project.name);
  return join(rootPath, safeProject, META_FILE);
}

async function readMeta(path: string): Promise<ProjectMeta> {
  try {
    const raw = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ProjectMeta;
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    return {};
  }
}

async function writeMeta(path: string, meta: ProjectMeta) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, JSON.stringify(meta, null, 2), "utf8");
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const pathOrRes = await resolveMetaPath(params.id);
  if (pathOrRes instanceof NextResponse) return pathOrRes;
  const meta = await readMeta(pathOrRes);
  return NextResponse.json(meta);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const pathOrRes = await resolveMetaPath(params.id);
  if (pathOrRes instanceof NextResponse) return pathOrRes;

  const payload = await request.json().catch(() => null);
  if (!payload) return badRequest("invalid payload");

  const next: ProjectMeta = {
    category: typeof payload.category === "string" ? payload.category.trim() : undefined,
    stage: typeof payload.stage === "string" ? payload.stage.trim() : undefined,
    platforms: normalizeStringArray(payload.platforms),
    deliverables: normalizeStringArray(payload.deliverables),
    audiences: normalizeStringArray(payload.audiences),
    commonTags: normalizeStringArray(payload.commonTags),
    updatedAt: toIsoWithOffset()
  };

  const merged: ProjectMeta = {
    ...next,
    category: next.category || undefined,
    stage: next.stage || undefined
  };

  await writeMeta(pathOrRes, merged);
  return NextResponse.json(merged);
}
