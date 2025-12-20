import matter from "gray-matter";
import type { PromptFrontmatter } from "../types/schema";

export interface ParsedPrompt {
  frontmatter: PromptFrontmatter | null;
  body: string;
  damaged: boolean;
}

export function parsePrompt(content: string): ParsedPrompt {
  try {
    const parsed = matter(content);
    return {
      frontmatter: parsed.data as PromptFrontmatter,
      body: parsed.content,
      damaged: false
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
  return matter.stringify(body, frontmatter);
}
