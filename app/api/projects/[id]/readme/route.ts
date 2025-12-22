import { NextResponse } from "next/server";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { getDb } from "@/lib/db";
import { readProjectReadme, writeProjectReadme } from "@/lib/fs/projects";
import { toIsoWithOffset } from "@/lib/utils/date";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await getDb();
  const project = db.data!.projects.find((p) => p.id === params.id);
  if (!project) return notFound("Project not found");

  const rootPath = db.data!.settings.rootPath ?? "";
  const result = await readProjectReadme({
    docPath: project.docPath,
    rootPath,
    projectName: project.name,
    fallbackContent: `# ${project.name}\n`
  });

  if (project.docPath !== result.path) {
    project.docPath = result.path;
    await db.write();
  }

  return NextResponse.json({
    content: result.content,
    path: result.path,
    hash: result.hash,
    mtimeMs: result.mtimeMs
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const payload = await request.json();
  if (typeof payload.content !== "string") {
    return badRequest("content is required", { field: "content" });
  }

  const db = await getDb();
  const project = db.data!.projects.find((p) => p.id === params.id);
  if (!project) return notFound("Project not found");

  const rootPath = db.data!.settings.rootPath ?? "";

  try {
    const writeResult = await writeProjectReadme({
      docPath: project.docPath,
      rootPath,
      projectName: project.name,
      content: payload.content,
      expectedHash: payload.expectedHash,
      expectedMtime: payload.expectedMtime
    });

    const updatedAt = toIsoWithOffset();
    project.updatedAt = updatedAt;
    project.docPath = writeResult.path;
    await db.write();

    return NextResponse.json({
      path: writeResult.path,
      hash: writeResult.hash,
      mtimeMs: writeResult.mtimeMs,
      updatedAt
    });
  } catch (error: any) {
    if (error?.code === "E_CONFLICT") {
      return conflict("Conflict detected", { currentHash: error.hash });
    }
    throw error;
  }
}
