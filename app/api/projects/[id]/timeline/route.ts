import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { badRequest, notFound } from "@/app/api/_lib/responses";
import { sanitizeFilename } from "@/lib/utils/sanitizeFilename";
import { toIsoWithOffset } from "@/lib/utils/date";

const TIMELINE_FILE = "_timeline.json";

type TimelineItem = {
  id: string;
  date: string;
  label?: string;
  content: string;
  createdAt: string;
};

async function resolveTimelinePath(projectId: string) {
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath ?? "";
  if (!rootPath) return badRequest("rootPath is not configured");

  const project = db.data!.projects.find((p) => p.id === projectId);
  if (!project) return notFound("Project not found");

  const safeProject = sanitizeFilename(project.name);
  return join(rootPath, safeProject, TIMELINE_FILE);
}

async function readTimeline(path: string): Promise<TimelineItem[]> {
  try {
    const raw = await fs.readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TimelineItem[]) : [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    return [];
  }
}

async function writeTimeline(path: string, items: TimelineItem[]) {
  await fs.mkdir(join(path, ".."), { recursive: true }).catch(() => {});
  await fs.writeFile(path, JSON.stringify(items, null, 2), "utf8");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const pathOrRes = await resolveTimelinePath(params.id);
  if (pathOrRes instanceof NextResponse) return pathOrRes;

  const items = await readTimeline(pathOrRes);
  items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return NextResponse.json(items);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const pathOrRes = await resolveTimelinePath(params.id);
  if (pathOrRes instanceof NextResponse) return pathOrRes;

  const payload = await request.json().catch(() => null);
  if (!payload) return badRequest("invalid payload");

  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  const content = typeof payload.content === "string" ? payload.content.trim() : "";
  const label = typeof payload.label === "string" ? payload.label.trim() : undefined;

  if (!date) return badRequest("date is required", { field: "date" });
  if (!content) return badRequest("content is required", { field: "content" });

  const items = await readTimeline(pathOrRes);
  const now = toIsoWithOffset();
  const next: TimelineItem = {
    id: `tl-${nanoid(8)}`,
    date,
    label: label ? sanitizeFilename(label).slice(0, 30) : undefined,
    content,
    createdAt: now
  };

  const merged = [next, ...items].slice(0, 200);
  await writeTimeline(pathOrRes, merged);
  return NextResponse.json(next, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const pathOrRes = await resolveTimelinePath(params.id);
  if (pathOrRes instanceof NextResponse) return pathOrRes;

  const payload = await request.json().catch(() => null);
  if (!payload) return badRequest("invalid payload");
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  if (!id) return badRequest("id is required", { field: "id" });

  const items = await readTimeline(pathOrRes);
  const next = items.filter((x) => x.id !== id);
  await writeTimeline(pathOrRes, next);
  return NextResponse.json({ ok: true });
}
