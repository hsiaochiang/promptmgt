import { parsePrompt } from "./frontmatter";
import type { PromptFrontmatter } from "../types/schema";

export function buildFullContent(frontmatter: PromptFrontmatter, body: string) {
  return `---\n${Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(", ")}]` : v}`)
    .join("\n")}\n---\n\n${body}`;
}

export function buildSlimContent(content: string) {
  const parsed = parsePrompt(content);
  return parsed.body.trim();
}
