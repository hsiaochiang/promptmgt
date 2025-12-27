# SYSTEM_SPEC.md — Prompt Management Workspace (Project + Conversation Only)

## 1. Purpose
Build a **local-first, file-based** Prompt Management Workspace to manage:
- **Projects** (containers / contexts)
- **Conversations** (prompt drafting/testing/iteration logs)

**Hard constraint:** Only implement **Project** and **Conversation**. Do **NOT** add WorkItem / Asset / Decision entities; represent those via fields/tags inside Conversation.

## 2. Storage Model (File-based DB)
All data is stored as **Markdown files** with **YAML Front Matter + Body**.

### 2.1 Directory Structure
Create this structure:

```text
data/
  config/
    taxonomy.json
  projects/
    {projectKey}/
      project.md
      conversations/
        YYYYMMDD-HHMM-{slug}.md
  archives/
    {projectKey}/
      project.md
      conversations/
        ...
```

### 2.2 Project Key (Folder Name)
`projectKey` format:
- `PRJ-{OrgOrScope}-{Topic}-{YYYY}`
- Allowed characters: `[A-Za-z0-9-]` only
- Must be unique

Examples:
- `PRJ-ESUN-FundingInquiry-2025`
- `PRJ-Internal-PromptOps-2025`
- `PRJ-Training-AIWorkflow-2025`

### 2.3 Conversation Filename
Conversation filename format:
- `YYYYMMDD-HHMM-{slug}.md`
- `slug` derived from title: lowercase, spaces → `-`, remove non-alphanumeric (keep `-`)

Example:
- `20251227-1530-prompt-draft-project-classification.md`

## 3. Taxonomy (Fixed Dictionaries)
Create `data/config/taxonomy.json` exactly as below and use it for dropdowns/multi-select chips.

```json
{
  "version": "1.0.0",
  "projectStatuses": [
    { "code": "ACTIVE", "name": "進行中" },
    { "code": "PAUSED", "name": "暫停" },
    { "code": "ARCHIVED", "name": "已封存" }
  ],
  "projectTypes": [
    { "code": "PRESALES", "name": "售前/提案（對客戶）" },
    { "code": "DELIVERY", "name": "交付/導入（對客戶）" },
    { "code": "INTERNAL_PRODUCT", "name": "內部工具/產品化" },
    { "code": "AUTOMATION", "name": "自動化工作流（n8n/Power Platform）" },
    { "code": "TEST_QA", "name": "測試/品質（Playwright/測試腳本）" },
    { "code": "TRAINING", "name": "教材/課程/內訓" },
    { "code": "RESEARCH", "name": "研究/選型/技術探索" },
    { "code": "OTHER", "name": "其他" }
  ],
  "conversationCategories": [
    { "code": "PROMPT_DRAFT", "name": "提示詞撰寫/拆解" },
    { "code": "PROMPT_REVIEW", "name": "提示詞審閱/調整策略" },
    { "code": "PROMPT_TEST", "name": "提示詞測試（輸入/輸出驗證）" },
    { "code": "PROMPT_REFACTOR", "name": "提示詞重構（結構化/模組化）" },
    { "code": "KNOWLEDGE_PACK", "name": "知識/資料整理（RAG/文件抽取）" },
    { "code": "OUTPUT_DRAFT", "name": "產出物生成（簡報/報告/文件）" },
    { "code": "INTEGRATION", "name": "工具整合（VS Code/Codex/流程串接）" },
    { "code": "RETROSPECTIVE", "name": "回顧/決策/下一步" }
  ],
  "promptStages": [
    { "code": "IDEA", "name": "構想" },
    { "code": "DRAFT", "name": "草稿" },
    { "code": "RUN", "name": "已跑測試" },
    { "code": "EVAL", "name": "評估/對照" },
    { "code": "ITERATE", "name": "迭代中" },
    { "code": "FINAL", "name": "已定稿" },
    { "code": "DEPRECATED", "name": "已淘汰" }
  ],
  "platformTags": [
    { "code": "CHATGPT", "name": "ChatGPT" },
    { "code": "GEMINI", "name": "Gemini" },
    { "code": "CLAUDE", "name": "Claude" },
    { "code": "COPILOT", "name": "GitHub Copilot" },
    { "code": "CODEX", "name": "Codex" },
    { "code": "N8N", "name": "n8n" },
    { "code": "POWER_PLATFORM", "name": "Power Platform" }
  ],
  "deliverableTags": [
    { "code": "MD", "name": "Markdown" },
    { "code": "PPTX", "name": "PPT" },
    { "code": "PDF", "name": "PDF" },
    { "code": "MERMAID", "name": "Mermaid/流程圖" },
    { "code": "JSON", "name": "JSON" },
    { "code": "XLSX", "name": "Excel" },
    { "code": "CODE", "name": "程式碼/腳本" },
    { "code": "SCRIPT", "name": "逐字稿/講稿" }
  ],
  "audienceTags": [
    { "code": "CLIENT", "name": "對客戶" },
    { "code": "MANAGER", "name": "對主管" },
    { "code": "INTERNAL", "name": "內部" },
    { "code": "TRAINING", "name": "教育訓練" }
  ],
  "commonTags": [
    { "code": "REUSABLE", "name": "可重用" },
    { "code": "NEED_CONFIRM", "name": "待確認" },
    { "code": "DECISION", "name": "決策" },
    { "code": "BLOCKED", "name": "卡關" },
    { "code": "GOOD_RESULT", "name": "效果佳" },
    { "code": "NEED_REWORK", "name": "需重作" },
    { "code": "SENSITIVE", "name": "敏感資訊" }
  ]
}
```

## 4. Markdown Templates (YAML Front Matter + Body)

### 4.1 Project (`data/projects/{projectKey}/project.md`)
```md
---
entity: Project
projectKey: PRJ-Internal-PromptOps-2025
name: 提示詞管理系統（個人使用）
projectType: INTERNAL_PRODUCT
status: ACTIVE

audienceTags: [INTERNAL]
platformTags: [CODEX, CHATGPT]
deliverableTags: [MD]
tags: [REUSABLE]

owner: Wilson
createdAt: "2025-12-27T15:00:00+08:00"
updatedAt: "2025-12-27T15:00:00+08:00"
---
## 專案目標
- ...

## 範圍
### In-scope
- ...
### Out-of-scope
- ...

## 使用規範
- 檔案命名規則
- 標籤使用規則
- 封存規則

## 目前狀態摘要
- ...
```

### 4.2 Conversation (`data/projects/{projectKey}/conversations/*.md`)
```md
---
entity: Conversation
projectKey: PRJ-Internal-PromptOps-2025

title: （必填）
date: "YYYY-MM-DD"
time: "HH:MM"

category: PROMPT_DRAFT
promptStage: DRAFT

platformTags: [CODEX]
audienceTags: [INTERNAL]
deliverableTags: [MD]
tags: [REUSABLE]

sourceLinks:
  - ""

summary: "（可選，建議用於列表與搜尋）"
updatedAt: "2025-12-27T15:30:00+08:00"
---
## 背景 / 目的
- ...

## 本次輸入（Prompt）
- Prompt v1:
- Prompt v2:

## 輸出摘要（Result Summary）
- ...

## 結論 / 決策
- ...

## 下一步（Next Steps）
- [ ] ...

## 備註
- ...
```

## 5. Validation Rules (Must Implement)
### 5.1 Project (Required Fields)
- `projectKey` (unique, matches naming rule)
- `name`
- `projectType` (must exist in taxonomy)
- `status` (must exist in taxonomy)
- `updatedAt` auto-updated on save

### 5.2 Conversation (Required Fields)
- `projectKey` must exist
- `title`
- `date`
- `category` (taxonomy)
- `promptStage` (taxonomy)
- `updatedAt` auto-updated on save

### 5.3 Taxonomy Enforcement
All enum fields must be restricted to `taxonomy.json` values (UI should prevent invalid values).

## 6. Core UI Requirements (Minimal)
Implement the following screens and actions.

### 6.1 Projects
- Projects list: filter by `status`, `projectType`, `tags`, keyword (name)
- Project detail:
  - Render `project.md` (markdown)
  - Conversations list (within the project)

Actions:
- Create project (creates folder + `project.md` + `conversations/`)
- Edit project metadata/body
- Archive project: move folder from `data/projects/` to `data/archives/` and set `status=ARCHIVED`

### 6.2 Conversations
- Conversation list (per project): filter by `category`, `promptStage`, tags, keyword (title/summary)
- Conversation editor: edit YAML fields + markdown body

Actions:
- Create conversation (generates file with correct filename)
- Edit conversation
- Delete conversation (optional, but preferred)

## 7. Indexing & Search (Optional but Recommended)
If implemented, generate `data/index.json` for faster search:
- Include project summaries and conversation metadata (title/summary/tags/category/promptStage/date)
- Rebuild index on demand (button) or after writes

## 8. Seed Data (For Demo)
Create two example projects with at least 2 conversations each:
- `PRJ-Internal-PromptOps-2025`
- `PRJ-ESUN-FundingInquiry-2025`

## 9. Definition of Done (Acceptance)
- Can create/edit/archive projects with correct file layout
- Can create/edit conversations with correct filename and YAML front matter
- Filters work correctly by taxonomy and tags
- All required field validations and taxonomy enforcement are in place
- No additional entities beyond Project and Conversation
