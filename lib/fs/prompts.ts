import { promises as fs } from "fs";
import { join, extname } from "path";
import { parsePrompt, serializePrompt } from "../utils/frontmatter";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import type { PromptFrontmatter, PromptListItem } from "../types/schema";

async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function listPrompts(rootPath: string): Promise<PromptListItem[]> {
  if (!rootPath) return [];
  const entries = await fs.readdir(rootPath, { withFileTypes: true });
  const prompts: PromptListItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const projectDir = join(rootPath, entry.name);
    const files = await fs.readdir(projectDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || extname(file.name) !== ".md") continue;
      const fullPath = join(projectDir, file.name);
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = parsePrompt(raw);
      if (!parsed.frontmatter) continue;
      prompts.push({
        id: fullPath,
        projectId: entry.name,
        ...parsed.frontmatter
      });
    }
  }

  return prompts;
}

export async function readPrompt(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return parsePrompt(raw);
}

export async function writePrompt(
  rootPath: string,
  projectName: string,
  frontmatter: PromptFrontmatter,
  body: string
) {
  if (!rootPath) {
    throw new Error("rootPath is not configured");
  }
  const safeProject = sanitizeFilename(projectName);
  const projectDir = join(rootPath, safeProject);
  await ensureDir(projectDir);
  const safeFile = `${sanitizeFilename(frontmatter.title)}.md`;
  const filePath = join(projectDir, safeFile);
  const content = serializePrompt(frontmatter, body);
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}
