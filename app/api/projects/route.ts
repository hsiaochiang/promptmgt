import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";

function now() {
  return new Date().toISOString();
}

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data!.projects);
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
