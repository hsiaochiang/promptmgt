import { promises as fs } from "fs";
import { dirname, join } from "path";
import { computeHash, hasConflict } from "../services/conflict";
import { sanitizeFilename } from "../utils/sanitizeFilename";

function createQueue() {
  let current = Promise.resolve();
  return <T>(task: () => Promise<T>) => {
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

function resolveDocPath(params: { docPath?: string; rootPath?: string; projectName: string }) {
  if (params.docPath) return params.docPath;
  const safe = sanitizeFilename(params.projectName || "未命名專案");
  const root = params.rootPath ?? "";
  return join(root, "Prompts", safe || "未命名專案", "README.md");
}

export interface ProjectReadmeResult {
  content: string;
  path: string;
  hash: string;
  mtimeMs: number;
}

export interface WriteProjectReadmeOptions {
  docPath?: string;
  rootPath?: string;
  projectName: string;
  content: string;
  expectedHash?: string;
  expectedMtime?: number;
}

export interface ReadProjectReadmeOptions {
  docPath?: string;
  rootPath?: string;
  projectName: string;
  fallbackContent?: string;
}

export async function readProjectReadme(options: ReadProjectReadmeOptions): Promise<ProjectReadmeResult> {
  const docPath = resolveDocPath({
    docPath: options.docPath,
    rootPath: options.rootPath,
    projectName: options.projectName
  });

  return fsQueue(async () => {
    try {
      const content = await fs.readFile(docPath, "utf8");
      const stat = await fs.stat(docPath);
      return { content, path: docPath, hash: computeHash(content), mtimeMs: stat.mtimeMs };
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
      const content = options.fallbackContent ?? `# ${options.projectName}\n`;
      await ensureDir(dirname(docPath));
      await fs.writeFile(docPath, content, "utf8");
      const stat = await fs.stat(docPath);
      return { content, path: docPath, hash: computeHash(content), mtimeMs: stat.mtimeMs };
    }
  });
}

export async function writeProjectReadme(options: WriteProjectReadmeOptions) {
  const docPath = resolveDocPath({
    docPath: options.docPath,
    rootPath: options.rootPath,
    projectName: options.projectName
  });

  return fsQueue(async () => {
    await ensureDir(dirname(docPath));

    const existingStat = await fs.stat(docPath).catch(() => null);
    const existingContent = existingStat ? await fs.readFile(docPath, "utf8") : null;
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
      throw Object.assign(new Error("Conflict detected"), {
        code: "E_CONFLICT",
        hash: existingHash,
        mtimeMs: existingStat.mtimeMs
      });
    }

    const content = options.content ?? "";
    await fs.writeFile(docPath, content, "utf8");
    const stat = await fs.stat(docPath);

    return { path: docPath, hash: computeHash(content), mtimeMs: stat.mtimeMs };
  });
}
