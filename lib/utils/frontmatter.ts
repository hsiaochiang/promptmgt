import matter from "gray-matter";
import { toIsoWithOffset } from "./date";
import type { PromptFrontmatter } from "../types/schema";

export interface ParsedPrompt {
  frontmatter: PromptFrontmatter | null;
  body: string;
  damaged: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
}

interface ParsePromptOptions {
  fallbackTitle?: string;
  fallbackProject?: string;
}

function buildFallbackFrontmatter(options?: ParsePromptOptions): PromptFrontmatter {
  const now = toIsoWithOffset();
  const title = options?.fallbackTitle?.trim().length ? options.fallbackTitle.trim() : "untitled";
  const project = options?.fallbackProject?.trim().length ? options.fallbackProject.trim() : "unspecified";
  return {
    title,
    project,
    type: "其他",
    status: "草稿",
    model: "",
    tags: [],
    updatedAt: now,
    createdAt: now
  };
}

function stripBrokenFrontmatter(content: string) {
  const match = content.match(/^---[\s\S]*?---\s*/);
  if (match) {
    return content.slice(match[0].length);
  }
  return content;
}

function normalizeFrontmatter(
  data: Record<string, unknown>,
  options?: ParsePromptOptions
): { fm: PromptFrontmatter; damaged: boolean; errorCode?: string; errorMessage?: string } {
  const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title.trim() : null;
  const project = typeof data.project === "string" && data.project.trim().length > 0 ? data.project.trim() : null;

  const tags = Array.isArray(data.tags)
    ? (data.tags as unknown[])
        .map((t) => (typeof t === "string" ? t.trim() : String(t ?? "").trim()))
        .filter((t) => t.length > 0)
    : [];

  const note =
    typeof (data as any).note === "string"
      ? (data as any).note
      : typeof (data as any).notes === "string"
        ? (data as any).notes
        : undefined;

  const fallback = buildFallbackFrontmatter(options);
  const missingRequired = !title || !project;
  const fm: PromptFrontmatter = {
    title: title ?? fallback.title,
    project: project ?? fallback.project,
    type: (typeof data.type === "string" && data.type.trim().length > 0 ? data.type : "其他") as PromptFrontmatter["type"],
    status: (typeof data.status === "string" && data.status.trim().length > 0
      ? data.status
      : "草稿") as PromptFrontmatter["status"],
    model: typeof data.model === "string" ? data.model : "",
    tags,
    note,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : fallback.updatedAt,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : fallback.createdAt
  };

  return {
    fm,
    damaged: missingRequired,
    errorCode: missingRequired ? "frontmatter_missing_required" : undefined,
    errorMessage: missingRequired ? "Frontmatter 缺少標題或專案，已套用預設值。" : undefined
  };
}

export function parsePrompt(content: string, options?: ParsePromptOptions): ParsedPrompt {
  try {
    const parsed = matter(content);
    const { fm, damaged, errorCode, errorMessage } = normalizeFrontmatter((parsed.data ?? {}) as Record<string, unknown>, options);
    return {
      frontmatter: fm,
      body: parsed.content,
      damaged,
      errorCode: errorCode ?? null,
      errorMessage: errorMessage ?? null
    };
  } catch (_err) {
    const fallback = buildFallbackFrontmatter(options);
    return {
      frontmatter: fallback,
      body: stripBrokenFrontmatter(content),
      damaged: true,
      errorCode: "frontmatter_parse_error",
      errorMessage: "Frontmatter YAML 損壞，已切換為純文字模式。"
    };
  }
}

export function serializePrompt(frontmatter: PromptFrontmatter, body: string) {
  const safeTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  const payload: Record<string, unknown> = {
    ...frontmatter,
    tags: safeTags,
    note: frontmatter.note,
    updatedAt: frontmatter.updatedAt ?? toIsoWithOffset()
  };

  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  }

  return matter.stringify(body ?? "", payload);
}
