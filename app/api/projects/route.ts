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
