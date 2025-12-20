import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { parsePrompt, serializePrompt } from "@/lib/utils/frontmatter";
import { computeHash, hasConflict } from "@/lib/services/conflict";
import { getDb } from "@/lib/db";

function decodeId(id: string) {
  return Buffer.from(id, "base64url").toString("utf8");
}

function now() {
  return new Date().toISOString();
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const filePath = decodeId(params.id);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parsePrompt(raw);
  const stat = await fs.stat(filePath);
  return NextResponse.json({
    id: params.id,
    frontmatter: parsed.frontmatter,
    body: parsed.body,
    hash: computeHash(raw),
    mtimeMs: stat.mtimeMs,
    damaged: parsed.damaged
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { frontmatter, body, clientHash } = await request.json();
  const filePath = decodeId(params.id);

  const current = await fs.readFile(filePath, "utf8");
  const stat = await fs.stat(filePath);
  const currentHash = computeHash(current);

  if (hasConflict({ localMtime: stat.mtimeMs, externalMtime: stat.mtimeMs, localHash: clientHash, externalHash: currentHash })) {
    return NextResponse.json(
      { message: "Conflict detected", currentHash },
      { status: 409 }
    );
  }

  const updatedFrontmatter = {
    ...frontmatter,
    updatedAt: frontmatter?.updatedAt ?? now()
  };
  const content = serializePrompt(updatedFrontmatter, body);
  await fs.writeFile(filePath, content, "utf8");
  const newHash = computeHash(content);
  const newStat = await fs.stat(filePath);

  // update project updatedAt in db
  const db = await getDb();
  const project = db.data!.projects.find((p) => p.name === updatedFrontmatter.project);
  if (project) {
    project.updatedAt = updatedFrontmatter.updatedAt;
    await db.write();
  }

  return NextResponse.json({
    hash: newHash,
    mtimeMs: newStat.mtimeMs,
    updatedAt: updatedFrontmatter.updatedAt
  });
}
