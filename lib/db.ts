import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { databaseSchema, type DatabaseSchema } from "./types/schema";

const DB_FILE = process.env.DB_FILE || join(process.cwd(), "db.json");
const DEFAULT_ROOT = process.env.DEFAULT_ROOT || join(process.cwd(), "Prompts");

const seedData: DatabaseSchema = {
  projects: [
    {
      id: "proj-1",
      name: "AI 工作流課程",
      status: "進行中",
      promptCount: 12,
      updatedAt: "2025-12-10T00:00:00.000Z"
    },
    {
      id: "proj-2",
      name: "企業資金詢價平台",
      status: "進行中",
      promptCount: 8,
      updatedAt: "2025-12-08T00:00:00.000Z"
    },
    {
      id: "proj-3",
      name: "貿易管理業務知識資料庫",
      status: "規劃中",
      promptCount: 5,
      updatedAt: "2025-12-05T00:00:00.000Z"
    }
  ],
  inbox: [
    {
      id: "inbox-1",
      title: "TAIA 官網改版－需求釐清提示詞草稿",
      content: "",
      createdAt: "2025-12-09T00:00:00.000Z",
      updatedAt: "2025-12-09T00:00:00.000Z",
      hint: "尚未指定專案與標籤"
    },
    {
      id: "inbox-2",
      title: "RAG 教學簡報逐字稿生成 v1",
      content: "",
      createdAt: "2025-12-09T00:00:00.000Z",
      updatedAt: "2025-12-09T00:00:00.000Z",
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
        "你是一位資深系統分析與網站規劃顧問，熟悉跨部門專案協作與需求釐清。"
    },
    {
      id: "s-2",
      name: "輸出格式－Markdown＋表格",
      category: "輸出格式",
      usage: 24,
      usageCount: 24,
      content: "請以 Markdown 格式輸出結果，必要時使用表格彙整重點。"
    },
    {
      id: "s-3",
      name: "RAG 回答規則",
      category: "限制條件",
      usage: 15,
      usageCount: 15,
      content: "所有回答必須以向量資料庫中的內容為主，無相關資訊時請明確回答不知道。"
    }
  ],
  settings: {
    rootPath: DEFAULT_ROOT,
    pinned: true,
    layout: {},
    fontScale: 2,
    telemetryEnabled: true,
    updateCheckEnabled: true,
    telemetry: { enabled: true }
  }
};

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
      const adapter = new JSONFile<DatabaseSchema>(DB_FILE);
      const db = new Low<DatabaseSchema>(adapter, seedData);
      await db.read();

      const parsed = databaseSchema.safeParse(db.data);
      if (parsed.success) {
        db.data = parsed.data;
      } else {
        const merged = {
          ...seedData,
          ...(db.data ?? {}),
          settings: { ...seedData.settings, ...(db.data as any)?.settings }
        };
        db.data = databaseSchema.parse(merged);
      }

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
