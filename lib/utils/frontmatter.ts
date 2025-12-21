import matter from "gray-matter";
import type { PromptFrontmatter } from "../types/schema";

export interface ParsedPrompt {
  frontmatter: PromptFrontmatter | null;
  body: string;
  damaged: boolean;
}

function normalizeFrontmatter(data: Record<string, unknown>): { fm: PromptFrontmatter | null; damaged: boolean } {
  const title = typeof data.title === "string" ? data.title : null;
  const project = typeof data.project === "string" ? data.project : null;

  const tags = Array.isArray(data.tags)
    ? (data.tags as unknown[])
        .map((t) => (typeof t === "string" ? t.trim() : String(t ?? "").trim()))
        .filter((t) => t.length > 0)
    : [];

  const note = typeof (data as any).note === "string"
    ? (data as any).note
    : typeof (data as any).notes === "string"
      ? (data as any).notes
      : undefined;

  const damaged = !title || !project;

  if (!title && !project) {
    return { fm: null, damaged: true };
  }

  const fm: PromptFrontmatter = {
    title: title ?? "untitled",
    project: project ?? "unspecified",
    type: (typeof data.type === "string" && data.type.trim().length > 0 ? data.type : "其他") as PromptFrontmatter["type"],
    status: (typeof data.status === "string" && data.status.trim().length > 0
      ? data.status
      : "草稿") as PromptFrontmatter["status"],
    model: typeof data.model === "string" ? data.model : "",
    tags,
    note,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined
  };

  return { fm, damaged };
}

export function parsePrompt(content: string): ParsedPrompt {
  try {
    const parsed = matter(content);
    const { fm, damaged } = normalizeFrontmatter((parsed.data ?? {}) as Record<string, unknown>);
    return {
      frontmatter: fm,
      body: parsed.content,
      damaged
    };
  } catch (_err) {
    return {
      frontmatter: null,
      body: content,
      damaged: true
    };
  }
}

export function serializePrompt(frontmatter: PromptFrontmatter, body: string) {
  const safeTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const payload: Record<string, unknown> = {
    ...frontmatter,
    tags: safeTags,
    note: frontmatter.note,
    updatedAt: frontmatter.updatedAt ?? new Date().toISOString()
  };

  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  }

  return matter.stringify(body ?? "", payload);
}
