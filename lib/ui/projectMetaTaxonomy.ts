export type ProjectMetaTaxonomyOption = { code: string; name: string };

export const CATEGORY_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "PRESALES", name: "售前/提案（對客戶）" },
  { code: "DELIVERY", name: "交付/導入（對客戶）" },
  { code: "INTERNAL_PRODUCT", name: "內部工具/產品化" },
  { code: "AUTOMATION", name: "自動化工作流" },
  { code: "TEST_QA", name: "測試/品質" },
  { code: "TRAINING", name: "教材/課程/內訓" },
  { code: "RESEARCH", name: "研究/選型/技術探索" },
  { code: "OTHER", name: "其他" }
];

export const STAGE_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "ACTIVE", name: "進行中" },
  { code: "PAUSED", name: "暫停" },
  { code: "ARCHIVED", name: "已封存" }
];

export const PLATFORM_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "CHATGPT", name: "ChatGPT" },
  { code: "GEMINI", name: "Gemini" },
  { code: "CLAUDE", name: "Claude" },
  { code: "COPILOT", name: "GitHub Copilot" },
  { code: "CODEX", name: "Codex" },
  { code: "N8N", name: "n8n" },
  { code: "POWER_PLATFORM", name: "Power Platform" }
];

export const DELIVERABLE_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "MD", name: "Markdown" },
  { code: "PPTX", name: "PPT" },
  { code: "PDF", name: "PDF" },
  { code: "MERMAID", name: "Mermaid/流程圖" },
  { code: "JSON", name: "JSON" },
  { code: "XLSX", name: "Excel" },
  { code: "CODE", name: "程式碼/腳本" },
  { code: "SCRIPT", name: "逐字稿/講稿" }
];

export const AUDIENCE_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "CLIENT", name: "對客戶" },
  { code: "MANAGER", name: "對主管" },
  { code: "INTERNAL", name: "內部" },
  { code: "TRAINING", name: "教育訓練" }
];

export const COMMON_TAG_OPTIONS: ProjectMetaTaxonomyOption[] = [
  { code: "REUSABLE", name: "可重用" },
  { code: "NEED_CONFIRM", name: "待確認" },
  { code: "DECISION", name: "決策" },
  { code: "BLOCKED", name: "卡關" },
  { code: "GOOD_RESULT", name: "效果佳" },
  { code: "NEED_REWORK", name: "需重作" },
  { code: "SENSITIVE", name: "敏感資訊" }
];

export function labelFromOptions(value: string, options: ProjectMetaTaxonomyOption[]) {
  const lowered = value.toLowerCase();
  const found = options.find((o) => o.code.toLowerCase() === lowered);
  return found?.name ?? value;
}
