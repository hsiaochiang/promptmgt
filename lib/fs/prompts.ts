import { promises as fs } from "fs";
import { dirname, extname, join } from "path";
import { parsePrompt, serializePrompt } from "../utils/frontmatter";
import { sanitizeFilename } from "../utils/sanitizeFilename";
import { computeHash, hasConflict } from "../services/conflict";
import type { PromptFrontmatter, PromptListItem } from "../types/schema";

type FsTask<T> = () => Promise<T>;

function createQueue() {
  let current = Promise.resolve();
  return <T>(task: FsTask<T>) => {
    const next = current.then(task, task);
    current = next.then(
      () => Promise.resolve(),
      () => Promise.resolve()
    );
    return next;
  };
}

const fsQueue = createQueue();

async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export interface PromptReadResult {
  frontmatter: PromptFrontmatter | null;
  body: string;
  damaged: boolean;
  hash: string;
  mtimeMs: number;
  path: string;
}

export interface WritePromptOptions {
  expectedHash?: string;
  expectedMtime?: number;
  targetPath?: string;
}

export async function listPrompts(rootPath: string): Promise<PromptListItem[]> {
  if (!rootPath) return [];
  try {
    await fs.access(rootPath);
  } catch {
    return [];
  }

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
      const stat = await fs.stat(fullPath);

      prompts.push({
        id: Buffer.from(fullPath, "utf8").toString("base64url"),
        projectId: entry.name,
        path: fullPath,
        ...parsed.frontmatter,
        updatedAt: parsed.frontmatter.updatedAt ?? stat.mtime.toISOString()
      });
    }
  }

  return prompts.sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? 0).getTime();
    const bTime = new Date(b.updatedAt ?? 0).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

export async function readPrompt(filePath: string): Promise<PromptReadResult> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parsePrompt(raw);
  const stat = await fs.stat(filePath);
  return {
    ...parsed,
    hash: computeHash(raw),
    mtimeMs: stat.mtimeMs,
    path: filePath
  };
}

export async function writePrompt(
  rootPath: string,
  projectName: string,
  frontmatter: PromptFrontmatter,
  body: string,
  options: WritePromptOptions = {}
) {
  if (!rootPath && !options.targetPath) {
    throw new Error("rootPath is not configured");
  }

  const safeProject = sanitizeFilename(projectName);
  const projectDir = options.targetPath ? dirname(options.targetPath) : join(rootPath, safeProject);
  const safeFile = `${sanitizeFilename(frontmatter.title ?? "untitled")}.md`;
  const filePath = options.targetPath ?? join(projectDir, safeFile);

  return fsQueue(async () => {
    await ensureDir(projectDir);

    const existingStat = await fs.stat(filePath).catch(() => null);
    const existingContent = existingStat ? await fs.readFile(filePath, "utf8") : null;
    const existingHash = existingContent ? computeHash(existingContent) : undefined;

    if (
      existingStat &&
      hasConflict({
        localMtime: options.expectedMtime ?? existingStat.mtimeMs,
        externalMtime: existingStat.mtimeMs,
        localHash: options.expectedHash,
        externalHash: existingHash
      })
    ) {
      throw Object.assign(new Error("Conflict detected"), { code: "E_CONFLICT", hash: existingHash });
    }

    const content = serializePrompt(frontmatter, body);
    await fs.writeFile(filePath, content, "utf8");
    const newStat = await fs.stat(filePath);

    return {
      filePath,
      hash: computeHash(content),
      mtimeMs: newStat.mtimeMs
    };
  });
}
