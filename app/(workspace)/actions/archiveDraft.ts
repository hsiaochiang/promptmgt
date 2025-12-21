"use server";

import { getDb } from "@/lib/db";
import { writePrompt } from "@/lib/fs/prompts";
import type { PromptFrontmatter } from "@/lib/types/schema";

interface ArchivePayload {
  draftId: string;
  projectName: string;
  frontmatter: PromptFrontmatter;
  body: string;
}

export async function archiveDraft(payload: ArchivePayload) {
  const db = await getDb();
  const draft = db.data!.inbox.find((i) => i.id === payload.draftId);
  if (!draft) {
    throw new Error("草稿不存在");
  }

  const { filePath, hash, mtimeMs } = await writePrompt(
    db.data!.settings.rootPath ?? "",
    payload.projectName,
    payload.frontmatter,
    payload.body
  );

  db.data!.inbox = db.data!.inbox.filter((i) => i.id !== payload.draftId);

  const project = db.data!.projects.find((p) => p.name === payload.projectName);
  if (project) {
    project.promptCount += 1;
    project.updatedAt = payload.frontmatter.updatedAt;
  }

  await db.write();
  const promptId = Buffer.from(filePath, "utf8").toString("base64url");

  return { filePath, promptId, hash, mtimeMs };
}
