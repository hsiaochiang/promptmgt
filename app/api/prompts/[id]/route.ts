import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { badRequest, conflict, notFound } from "@/app/api/_lib/responses";
import { hasConflict } from "@/lib/services/conflict";
import { getDb } from "@/lib/db";
import { listPrompts, readPrompt, writePrompt } from "@/lib/fs/prompts";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";
import { toIsoWithOffset } from "@/lib/utils/date";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { promptFrontmatterSchema } from "@/lib/types/schema";

function decodeId(id: string) {
  return Buffer.from(id, "base64url").toString("utf8");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const filePath = decodeId(params.id);
  try {
    const result = await readPrompt(filePath);
    return NextResponse.json({
      id: params.id,
      frontmatter: result.frontmatter,
      body: result.body,
      hash: result.hash,
      mtimeMs: result.mtimeMs,
      damaged: result.damaged,
      errorCode: result.errorCode ?? null,
      errorMessage: result.errorMessage ?? null
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return notFound("Prompt not found");
    }
    throw error;
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { frontmatter, body, clientHash, clientMtime } = await request.json();
  const filePath = decodeId(params.id);
  const current = await readPrompt(filePath);

  if (
    hasConflict({
      localMtime: clientMtime ?? current.mtimeMs,
      externalMtime: current.mtimeMs,
      localHash: clientHash,
      externalHash: current.hash
    })
  ) {
    return conflict("Conflict detected", { currentHash: current.hash, currentMtime: current.mtimeMs });
  }

  const baseFrontmatter: Partial<PromptFrontmatter> = current.frontmatter ?? {};
  const serverNow = toIsoWithOffset();
  const mergedFrontmatterInput = {
    ...baseFrontmatter,
    ...frontmatter,
    updatedAt: serverNow,
    createdAt: baseFrontmatter.createdAt ?? frontmatter?.createdAt ?? toIsoWithOffset()
  };
  const parsedFrontmatter = (() => {
    try {
      return promptFrontmatterSchema.parse(mergedFrontmatterInput);
    } catch (err: any) {
      return badRequest("frontmatter validation failed", { issues: err?.issues });
    }
  })();
  if (parsedFrontmatter instanceof NextResponse) return parsedFrontmatter;
  const updatedFrontmatter = parsedFrontmatter;
  const projectName = updatedFrontmatter.project ?? baseFrontmatter.project;

  if (!projectName) {
    return badRequest("project is required");
  }

  const writeResult = await (async () => {
    try {
      return await writePrompt("", projectName, updatedFrontmatter, body, {
        expectedHash: clientHash,
        expectedMtime: clientMtime ?? current.mtimeMs,
        targetPath: filePath
      });
    } catch (error: any) {
      if (error?.code === "E_CONFLICT") {
        return conflict("Conflict detected", { currentHash: current.hash, currentMtime: current.mtimeMs });
      }
      throw error;
    }
  })();

  if (writeResult instanceof NextResponse) return writeResult;
  const { hash: newHash, mtimeMs: newMtime } = writeResult;

  // update project updatedAt in db
  const db = await getDb();
  const project = db.data!.projects.find((p) => p.name === projectName);
  if (project) {
    project.updatedAt = updatedFrontmatter.updatedAt;
  }

  const rootPath = db.data!.settings.rootPath;
  if (rootPath) {
    const prompts = await listPrompts(rootPath);
    setPromptMetaFromPrompts(prompts);
    db.data!.projects = applyPromptMeta(db.data!.projects);
  }

  await db.write();

  return NextResponse.json({
    hash: newHash,
    mtimeMs: newMtime,
    updatedAt: updatedFrontmatter.updatedAt
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const filePath = decodeId(params.id);
  const db = await getDb();
  const rootPath = db.data!.settings.rootPath;

  let projectName: string | null = null;
  try {
    const parsed = await readPrompt(filePath);
    projectName = parsed.frontmatter?.project ?? null;
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  await fs.rm(filePath, { force: true });

  if (projectName && rootPath) {
    const prompts = await listPrompts(rootPath);
    setPromptMetaFromPrompts(prompts);
    db.data!.projects = applyPromptMeta(db.data!.projects);
  }

  await db.write();
  return NextResponse.json({ ok: true });
}
