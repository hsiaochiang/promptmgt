import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { databaseSchema, type DatabaseSchema } from "./types/schema";
import { toIsoWithOffset } from "./utils/date";

const DB_FILE = process.env.DB_FILE || join(process.cwd(), "db.json");
const DEFAULT_ROOT = process.env.DEFAULT_ROOT || join(homedir(), ".promptmgt");
const DEFAULT_LOG_PATH = join(DEFAULT_ROOT, "logs", "app.log");

function ensureIsoUtc8(value?: string) {
  if (value && value.includes("+08:00") && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  const parsed = value ? new Date(value) : new Date();
  return toIsoWithOffset(parsed);
}

function projectDocPath(name: string) {
  return join(DEFAULT_ROOT, "Prompts", name || "未命名專案", "README.md");
}

const seedData: DatabaseSchema = {
  projects: [
    {
      id: "proj-1",
      name: "AI 工作流課程",
      status: "進行中",
      promptCount: 12,
      docPath: projectDocPath("AI 工作流課程"),
      createdAt: ensureIsoUtc8("2025-12-01T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z")
    },
    {
      id: "proj-2",
      name: "企業資金詢價平台",
      status: "進行中",
      promptCount: 8,
      docPath: projectDocPath("企業資金詢價平台"),
      createdAt: ensureIsoUtc8("2025-12-01T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-08T00:00:00.000Z")
    },
    {
      id: "proj-3",
      name: "貿易管理業務知識資料庫",
      status: "規劃中",
      promptCount: 5,
      docPath: projectDocPath("貿易管理業務知識資料庫"),
      createdAt: ensureIsoUtc8("2025-12-01T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-05T00:00:00.000Z")
    }
  ],
  inbox: [
    {
      id: "inbox-1",
      title: "TAIA 官網改版－需求釐清提示詞草稿",
      content: "",
      createdAt: ensureIsoUtc8("2025-12-09T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-09T00:00:00.000Z"),
      hint: "尚未指定專案與標籤"
    },
    {
      id: "inbox-2",
      title: "RAG 教學簡報逐字稿生成 v1",
      content: "",
      createdAt: ensureIsoUtc8("2025-12-09T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-09T00:00:00.000Z"),
      hint: "候選：AI 工作流課程 / 外部授課"
    }
  ],
  snippets: [
    {
      id: "s-1",
      name: "角色設定－資深系統分析顧問",
      category: "角色設定",
      usage: 18,
      usageCount: 18,
      content:
        "你是一位資深系統分析與網站規劃顧問，熟悉跨部門專案協作與需求釐清。",
      createdAt: ensureIsoUtc8("2025-12-05T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z"),
      lastUsedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z")
    },
    {
      id: "s-2",
      name: "輸出格式－Markdown＋表格",
      category: "輸出格式",
      usage: 24,
      usageCount: 24,
      content: "請以 Markdown 格式輸出結果，必要時使用表格彙整重點。",
      createdAt: ensureIsoUtc8("2025-12-05T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z"),
      lastUsedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z")
    },
    {
      id: "s-3",
      name: "RAG 回答規則",
      category: "限制條件",
      usage: 15,
      usageCount: 15,
      content: "所有回答必須以向量資料庫中的內容為主，無相關資訊時請明確回答不知道。",
      createdAt: ensureIsoUtc8("2025-12-05T00:00:00.000Z"),
      updatedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z"),
      lastUsedAt: ensureIsoUtc8("2025-12-10T00:00:00.000Z")
    }
  ],
  settings: {
    rootPath: DEFAULT_ROOT,
    pinned: true,
    layout: {},
    fontScale: 2,
    telemetryEnabled: true,
    updateCheckEnabled: true,
    telemetry: { enabled: true },
    logPath: DEFAULT_LOG_PATH,
    createdAt: ensureIsoUtc8(),
    updatedAt: ensureIsoUtc8()
  }
};

function normalizeData(raw?: Partial<DatabaseSchema>): DatabaseSchema {
  const source = raw ?? seedData;
  const projects = (source.projects ?? seedData.projects).map((proj) => ({
    ...proj,
    docPath: proj.docPath ?? projectDocPath(proj.name ?? ""),
    promptCount: typeof proj.promptCount === "number" ? proj.promptCount : 0,
    createdAt: ensureIsoUtc8(proj.createdAt),
    updatedAt: ensureIsoUtc8(proj.updatedAt)
  }));

  const inbox = (source.inbox ?? seedData.inbox).map((item) => ({
    ...item,
    createdAt: ensureIsoUtc8(item.createdAt),
    updatedAt: ensureIsoUtc8(item.updatedAt)
  }));

  const snippets = (source.snippets ?? seedData.snippets).map((snip) => {
    const usage =
      typeof snip.usage === "number"
        ? snip.usage
        : typeof snip.usageCount === "number"
          ? snip.usageCount
          : 0;
    const lastUsedAt = snip.lastUsedAt ? ensureIsoUtc8(snip.lastUsedAt) : undefined;
    return {
      ...snip,
      usage,
      usageCount: typeof snip.usageCount === "number" ? snip.usageCount : usage,
      createdAt: ensureIsoUtc8(snip.createdAt),
      updatedAt: ensureIsoUtc8(snip.updatedAt),
      lastUsedAt
    };
  });

  const rootPath = (source.settings ?? {}).rootPath ?? seedData.settings.rootPath;
  const logPath = (source.settings ?? {}).logPath ?? DEFAULT_LOG_PATH;
  const settings = {
    ...seedData.settings,
    ...(source.settings ?? {}),
    rootPath,
    logPath,
    createdAt: ensureIsoUtc8((source.settings as any)?.createdAt),
    updatedAt: ensureIsoUtc8((source.settings as any)?.updatedAt)
  };

  return { projects, inbox, snippets, settings };
}

function createWriteQueue() {
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

const dbWriteQueue = createWriteQueue();
let dbPromise: Promise<Low<DatabaseSchema>> | null = null;

async function initDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const dir = dirname(DB_FILE);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const shouldSeedFile = !existsSync(DB_FILE);
      if (!existsSync(DEFAULT_ROOT)) {
        mkdirSync(DEFAULT_ROOT, { recursive: true });
      }
      const adapter = new JSONFile<DatabaseSchema>(DB_FILE);
      const db = new Low<DatabaseSchema>(adapter, normalizeData(seedData));
      await db.read();

      const normalized = normalizeData(db.data ?? seedData);
      db.data = databaseSchema.parse(normalized);

      // serialize concurrent writes to prevent file corruption
      const originalWrite = db.write.bind(db);
      db.write = () => dbWriteQueue(() => originalWrite());

      if (shouldSeedFile) {
        await db.write();
      }

      return db;
    })();
  }
  return dbPromise;
}

export async function getDb() {
  return initDb();
}
