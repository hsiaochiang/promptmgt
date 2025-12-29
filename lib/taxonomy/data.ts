export interface TaxonomyValue {
  code: string;
  name: string;
}

export const projectStatuses: TaxonomyValue[] = [
  { code: "ACTIVE", name: "進行中" },
  { code: "PAUSED", name: "暫停" },
  { code: "ARCHIVED", name: "已封存" }
];

export const projectTypes: TaxonomyValue[] = [
  { code: "PRESALES", name: "售前/提案（對客戶）" },
  { code: "DELIVERY", name: "交付/導入（對客戶）" },
  { code: "INTERNAL_PRODUCT", name: "內部工具/產品化" },
  { code: "AUTOMATION", name: "自動化工作流（n8n/Power Platform）" },
  { code: "TEST_QA", name: "測試/品質（Playwright/測試腳本）" },
  { code: "TRAINING", name: "教材/課程/內訓" },
  { code: "RESEARCH", name: "研究/選型/技術探索" },
  { code: "OTHER", name: "其他" }
];

export const promptCategories: TaxonomyValue[] = [
  { code: "PROMPT_DRAFT", name: "提示詞撰寫/拆解" },
  { code: "PROMPT_REVIEW", name: "提示詞審閱/調整策略" },
  { code: "PROMPT_TEST", name: "提示詞測試（輸入/輸出驗證）" },
  { code: "PROMPT_REFACTOR", name: "提示詞重構（結構化/模組化）" },
  { code: "KNOWLEDGE_PACK", name: "知識/資料整理（RAG/文件抽取）" },
  { code: "OUTPUT_DRAFT", name: "產出物生成（簡報/報告/文件）" },
  { code: "INTEGRATION", name: "工具整合（VS Code/Codex/流程串接）" },
  { code: "RETROSPECTIVE", name: "回顧/決策/下一步" }
];

export const promptStages: TaxonomyValue[] = [
  { code: "IDEA", name: "構想" },
  { code: "DRAFT", name: "草稿" },
  { code: "RUN", name: "已跑測試" },
  { code: "EVAL", name: "評估/對照" },
  { code: "ITERATE", name: "迭代中" },
  { code: "FINAL", name: "已定稿" },
  { code: "DEPRECATED", name: "已淘汰" }
];

export const platformTags: TaxonomyValue[] = [
  { code: "CHATGPT", name: "ChatGPT" },
  { code: "GEMINI", name: "Gemini" },
  { code: "CLAUDE", name: "Claude" },
  { code: "COPILOT", name: "GitHub Copilot" },
  { code: "CODEX", name: "Codex" },
  { code: "N8N", name: "n8n" },
  { code: "POWER_PLATFORM", name: "Power Platform" }
];

export const deliverableTags: TaxonomyValue[] = [
  { code: "MD", name: "Markdown" },
  { code: "PPTX", name: "PPT" },
  { code: "PDF", name: "PDF" },
  { code: "MERMAID", name: "Mermaid/流程圖" },
  { code: "JSON", name: "JSON" },
  { code: "XLSX", name: "Excel" },
  { code: "CODE", name: "程式碼/腳本" },
  { code: "SCRIPT", name: "逐字稿/講稿" }
];

export const audienceTags: TaxonomyValue[] = [
  { code: "CLIENT", name: "對客戶" },
  { code: "MANAGER", name: "對主管" },
  { code: "INTERNAL", name: "內部" },
  { code: "TRAINING", name: "教育訓練" }
];

export const commonTags: TaxonomyValue[] = [
  { code: "REUSABLE", name: "可重用" },
  { code: "NEED_CONFIRM", name: "待確認" },
  { code: "DECISION", name: "決策" },
  { code: "BLOCKED", name: "卡關" },
  { code: "GOOD_RESULT", name: "效果佳" },
  { code: "NEED_REWORK", name: "需重作" },
  { code: "SENSITIVE", name: "敏感資訊" }
];
