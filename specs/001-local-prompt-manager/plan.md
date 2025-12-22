# Implementation Plan: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

**Branch**: `001-local-prompt-manager` | **Date**: 2025-12-22 | **Spec**: specs/001-local-prompt-manager/spec.md
**Input**: Feature specification from `/specs/001-local-prompt-manager/spec.md`

## Summary

本功能在本機提供提示詞管理：收件匣草稿→專案歸檔→Markdown 編輯與精準複製，資料採 Markdown 檔 + LowDB 雙層儲存，前端以 Next.js App Router。新增要求：每個專案需有專案說明 README（Markdown），所有時間欄位統一儲存為 ISO 8601（UTC+08:00），UI 顯示 `MM/DD HH:mm`，編輯器標題列顯示 `HH:mm`。時間欄位 `createdAt/updatedAt` 對所有實體為必填並自動補值。

## Technical Context

**Language/Version**: TypeScript 5.x、Next.js 14（App Router）、Node.js 18  
**Primary Dependencies**: Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod、gray-matter、@uiw/react-codemirror、localStorage 偏好封裝、自訂 clipboard/frontmatter/date utils  
**Storage**: Markdown 檔（提示詞＋專案 README）+ LowDB（db.json 指標/設定）+ localStorage（Pin/寬度/字級/偏好）。所有時間儲存為 ISO 8601（UTC+08:00），前端依格式化函式顯示  
**Testing**: Vitest（單元/整合）、React Testing Library、契約測試（tests/contract）、整合測試（tests/integration）；覆蓋率 ≥80%，關鍵路徑力求 100%  
**Target Platform**: 桌面瀏覽器（Chromium/Edge）本機執行，Windows/macOS；Node 18 runtime  
**Project Type**: Web（Next.js 全端：App Router + Route Handlers）  
**Performance Goals**: 啟動載入 50 專案/500 提示詞 ≤5 秒；搜尋 p95 ≤2 秒（1000 筆截斷）；自動儲存 2 秒節奏；Pin 收合 150–250ms；精簡複製驗收 ≤3 秒（內部目標 <150ms）；時間格式一致性（SC-021）  
**Constraints**: 離線優先、僅本機檔案；檔案衝突需提示決策；WCAG 2.1 AA；遙測/更新檢查預設可用但可停用，遙測僅本機 5MB 環迴；UPDATE_CHECK_ENDPOINT 必須 https；時間以 UTC+08:00 儲存並顯示；專案需帶 README 檔  
**Scale/Scope**: 目標規模專案 ~50、提示詞 ~500、收件匣 100+（需分頁）、片語數百；單機單用戶並發

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 語言：所有規劃文件與使用者文件需為繁體中文（憲章 V）；本計畫全程以繁中撰寫。
- 測試：TDD、覆蓋率 ≥80%，契約/整合/單元依測試金字塔；缺測試不得過關。
- UX/可及性：WCAG 2.1 AA，錯誤可修復、快速回饋；時間顯示與格式一致性需驗證（SC-021）。
- 效能：需量測 SC-001/SC-002/SC-003/SC-004/SC-008/SC-011/SC-021；未達標需調優方案。
- 觀測性：本機 5MB 環迴遙測，可停用/匯出；符合離線與隱私要求。
- 文件：quickstart/README/plan/spec/tasks 需更新且維持一致。

## Project Structure

### Documentation (this feature)

```text
specs/001-local-prompt-manager/
├── plan.md              # 本文件（/speckit.plan 輸出）
├── research.md          # Phase 0 研究/決策
├── data-model.md        # Phase 1 資料模型/驗證
├── quickstart.md        # Phase 1 啟動/操作指南
├── contracts/           # Phase 1 API 合約（OpenAPI）
└── tasks.md             # Phase 2 任務列表（/speckit.tasks）
```

### Source Code (repository root)

```text
app/
├── globals.css
├── layout.tsx
├── page.tsx
└── (workspace)/               # 前端列表/編輯/設定
    ├── actions/
    ├── components/
    ├── hooks/
    ├── settings/
    ├── store/
    └── utils/
api/                           # Next.js Route Handlers
├── inbox/
├── projects/
├── prompts/
├── search/
├── settings/
└── snippets/

lib/
├── db.ts
├── db/
│   └── fs/ (prompts.ts ...)
├── services/ (cache/conflict/search/settings/telemetry)
└── utils/ (clipboard/frontmatter/sanitizeFilename/date)

tests/
├── contract/
├── integration/
└── unit/

docs/ (env-setup, perf-checks, startup-guide, ux-checks, settings/telemetry)
coverage/ (lcov-report)
```

**Structure Decision**: 採 Next.js 單倉全端架構；前端與 Route Handlers 同在 `app/`，資料/服務層在 `lib/`，測試依類型分布於 `tests/contract|integration|unit`。

## Complexity Tracking

目前無憲章違規需豁免。表格留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
