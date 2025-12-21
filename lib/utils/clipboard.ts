import { parsePrompt, serializePrompt } from "./frontmatter";
import type { PromptFrontmatter } from "../types/schema";

export function buildFullContent(frontmatter: PromptFrontmatter, body: string) {
  return serializePrompt(frontmatter, body ?? "");
}

export function buildSlimContent(content: string) {
  const parsed = parsePrompt(content);
  return parsed.body.trim();
}
