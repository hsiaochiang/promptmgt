# Implementation Plan: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

**Branch**: `001-local-prompt-manager` | **Date**: 2025-12-21 | **Spec**: specs/001-local-prompt-manager/spec.md
**Input**: Feature specification from `/specs/001-local-prompt-manager/spec.md`

**Note**: This模板由 `/speckit.plan` 產生，內容需全程維持繁體中文並符合專案憲章。

## Summary

本功能為本機執行的提示詞管理應用，採 Markdown 檔案 + LowDB JSON 雙層儲存，提供收件匣草稿→專案歸檔→提示詞編輯/複製→片語插入的工作流，並支援三欄佈局、Pin/專注模式、快捷鍵與本機持久化設定（localStorage）。

## Technical Context

**Language/Version**: TypeScript 5.x、Next.js 14（App Router）、Node.js 18  
**Primary Dependencies**: Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod（schema 驗證）、localStorage（用戶端偏好）；資料抓取採原生 fetch（目前不新增 React Query/SWR 依賴）  
**Storage**: 檔案系統（專案資料夾內的 Markdown 檔）＋ LowDB JSON（db.json）＋ localStorage（Pin/寬度/快捷偏好）；每個專案需有專案說明 Markdown 檔保存專案資訊與進度  
**Testing**: Vitest（單元/整合）、React Testing Library（元件）、契約測試（tests/contract）、整合測試（tests/integration）；需維持 TDD、覆蓋率 ≥80%  
**Target Platform**: 桌面瀏覽器（Chromium/Edge）在本機 localhost 執行，Windows/macOS；Node 18 runtime  
**Project Type**: Web（Next.js 全端：App Router + Route Handlers）  
**Performance Goals**: 啟動/載入 50 專案 + 500 提示詞 ≤5 秒；搜尋 p95 ≤2 秒（1000 筆內，>1000 截斷為 1000 並提示截斷旗標）；自動儲存持續 2 秒節奏；Pin 收合動畫 150–250ms；精簡複製 驗收 ≤3 秒（內部目標 <150ms）；草稿→轉正流程 ≤30 秒；時間格式統一儲存為 ISO 8601（UTC+08:00），UI 顯示 "MM/DD HH:mm"（編輯器已儲存時間顯示 HH:mm 並置頂）；首次導覽成功率（SC-009） ≥80%；收件匣 >100 筆啟用分頁（預設 50/頁，可配置，搜尋需跨頁）；片語 CRUD/UI/API 驗收以 FR-010 為準，FR-021 僅保留追蹤；UX 檢核新增 SC-016~SC-021（Inbox 淨空、Undo/Redo 易發現性、Accordion 快捷鍵、錯誤敘述、長操作忙碌指示、時間格式一致性）
**Constraints**: 離線優先（不依賴雲端），檔案系統權限沿用 OS 帳戶；localStorage 持久化佈局/Pin；需處理檔案衝突偵測與使用者決策；前端需符合 WCAG 2.1 AA（字級 +2px、不裁切）；資料僅單機存放，無應用層加密；觀測性/遙測採本機匿名暫存（5MB 環迴、無外傳）、可停用、可匯出，設定頁需提供開關與匯出入口  
**Update Check Strategy**: UPDATE_CHECK_ENDPOINT 僅接受 https；缺少端點或使用者停用時跳過（no-op）；設定頁可手動檢查並回報 status（skipped/available/up-to-date/failed）；toggle 狀態持久化於 LowDB + localStorage 快取；預設不排程自動檢查，避免離線時多餘呼叫。
**Scale/Scope**: 目標資料量：專案 ~50、提示詞 ~500、收件匣草稿 100+（需分頁/搜尋），片語庫數百筆；單機單用戶並發，前後端同機

**Performance Validation Plan**:
- 建立 perf 測試腳本與/或手動步驟，使用 50 專案/500 提示詞資料集驗證 SC-001/SC-002/SC-008。
- 搜尋壓測：使用 1000 筆提示詞資料集量測 p95≤2 秒並驗證超量截斷旗標（SC-004/FR-017）。
- 互動 SLA：量測精簡複製驗收 ≤3 秒（內部目標 <150ms）、片語插入 ≤10 秒、Pin 收合 150–250ms、快捷鍵成功率、Undo 成功率；結果填入 docs/perf-checks.md、docs/ux-checks.md。
- UX SLA：依 docs/ux-checks.md 驗證 SC-009、SC-010 及新增 SC-016~SC-021（Inbox 淨空、Undo/Redo 易發現性、Accordion 快捷鍵、錯誤敘述、長操作忙碌指示、時間格式一致性），並納入 T062/T063 對應表。
- 時間格式驗證：抽樣檢查儲存時間（ISO 8601, UTC+08:00）與顯示格式（"MM/DD HH:mm"；編輯器已儲存時間顯示 HH:mm 置頂），納入 perf/ux 檢核與回歸。
- 自動化覆蓋：將上述量測與成功率驗證掛入 tests/ 或文件化手動流程，並在回歸任務中重複執行。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 語言：所有規劃/文件須為繁體中文（符合憲章 V），目前文件符合。
- 測試：需 TDD、覆蓋率 ≥80%，契約/整合/單元測試比例遵守測試金字塔；現狀需於計畫中落實，不得省略。
- UX/可及性：需遵守 WCAG 2.1 AA，快速回饋、錯誤可修正；Plan/設計需標記持續符合。
- 效能：需量化並對應成功指標（已在 Technical Context），落地時需驗證。
- 觀測性：Phase 0 已選擇「本機暫存、可匯出」遙測方案（5MB 環迴、無外傳、可停用/匯出），不再有未解事項。

## Project Structure

### Documentation (this feature)

```text
specs/001-local-prompt-manager/
├── plan.md              # 本文件（/speckit.plan 輸出）
├── research.md          # Phase 0（研究/決策彙總）
├── data-model.md        # Phase 1（資料模型/驗證）
├── quickstart.md        # Phase 1（啟動/使用教學）
├── contracts/           # Phase 1（API 合約 OpenAPI/GraphQL）
└── tasks.md             # Phase 2（/speckit.tasks 產物，非本命令）
```

### Source Code (repository root)

```text
app/
├── globals.css
├── layout.tsx
├── page.tsx
├── (workspace)/                 # 前端工作區（列表/編輯器/片語）
│   ├── actions/
│   ├── components/
│   ├── hooks/
│   ├── settings/
│   └── store/
└── api/                         # Next Route Handlers（REST 風格）
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
└── utils/ (clipboard/frontmatter/sanitizeFilename)

tests/
├── contract/
├── integration/
└── unit/

docs/ (env-setup, perf-checks, startup-guide, ux-checks, settings/telemetry)
coverage/ (lcov-report)
```

**Structure Decision**: 採 Next.js 單倉全端專案，前端位於 app/（含 Route Handlers），核心邏輯/資料層位於 lib/，測試依 pyramid 分布於 tests/contract|integration|unit。憑藉現有架構擴充，不新增子專案。

## Complexity Tracking

> 目前無憲章違規需豁免，表格留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

