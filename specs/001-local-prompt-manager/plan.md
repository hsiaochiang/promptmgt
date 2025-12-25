# Implementation Plan: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

**Branch**: `001-local-prompt-manager` | **Date**: 2025-12-25 | **Spec**: [specs/001-local-prompt-manager/spec.md](specs/001-local-prompt-manager/spec.md)
**Input**: Feature specification from `/specs/001-local-prompt-manager/spec.md`

## Summary

建立本機執行的提示詞管理系統，採雙層儲存（Markdown 檔案＋LowDB JSON）與 Next.js App Router REST API，支援收件匣草稿 → 專案歸檔 → 片語插入工作流。自動儲存 2 秒節奏、Frontmatter 檔案寫入、衝突偵測提示三選，並以結構化日誌寫入本機循環檔案（遮蔽敏感資訊、含 console mirror），滿足 Clarifications 與 NFR。

## Technical Context

**Language/Version**: TypeScript 5.x、Next.js 14 App Router（Node.js 18+）  
**Primary Dependencies**: Next.js Route Handlers、LowDB、zod、remark/markdown 工具、localStorage 偏好、剪貼簿 API  
**Storage**: Markdown 檔案（Frontmatter + 內容）＋ LowDB JSON（索引/設定/狀態），使用者目錄隱藏資料夾；本機結構化日誌循環檔案  
**Testing**: Vitest（unit/contract/integration，jsdom）、契約測試對齊 OpenAPI 3.1、覆蓋率目標 ≥80%（關鍵路徑 100%）  
**Target Platform**: 本機瀏覽器 (localhost) + Node.js 18+（Windows/macOS）  
**Project Type**: Web（Next.js App Router 單體）  
**Performance Goals**: 啟動至可輸入 ≤5 秒；草稿轉正 ≤30 秒；搜尋 ≤2 秒（1000 筆）；精簡複製 ≤3 秒；Pin 收合 150–250ms；Undo 成功率 ≥95%  
**Constraints**: 離線優先、不可外傳資料；檔名合法化；Frontmatter 損壞需降級顯示；衝突三選；字級 +2px 無裁切；本機日誌遮蔽敏感資訊  
**Scale/Scope**: 50 專案 / 500 提示詞資料集；Inbox >100 啟用分頁；搜尋結果最多 1000 筆（提示截斷）

## Constitution Check

*GATE: 必須通過後才能進入 Phase 0 研究，Phase 1 完成後需再檢視。*

- 語言：所有規格/計畫/使用者文件皆採繁體中文（Principle V）。
- 測試：TDD、覆蓋率 ≥80%，關鍵路徑 100%，契約測試覆蓋公開 API（Principle II）。
- UX：WCAG 2.1 AA、介面一致、可行動的錯誤回饋、提供 Quickstart 與驗收場景（Principle III）。
- 效能：滿足 SC-001~SC-021 SLA，必要時量測與 perf 檢核（Principle IV）。
- 品質：遵循既有模式與模組化；複雜度如有例外需記錄在 Complexity Tracking（Principle I）。

**狀態**：目前無違規項，Phase 1 完成後再複核。

## Project Structure

### Documentation（本功能）

```text
specs/001-local-prompt-manager/
├── plan.md          # 本文件（/speckit.plan 輸出）
├── research.md      # Phase 0 研究決策
├── data-model.md    # Phase 1 資料模型
├── quickstart.md    # Phase 1 快速開始/操作指引
├── contracts/       # Phase 1 OpenAPI/摘要
└── tasks.md         # Phase 2 (/speckit.tasks 輸出)
```

### Source Code（現有主要路徑）

```text
app/                # Next.js App Router（UI + route handlers）
app/api/            # REST API（inbox/projects/prompts/snippets/search/settings）
lib/                # 資料層（db/fs/services/utils/types）
tests/              # 契約/整合/單元測試（Vitest）
docs/               # 環境、效能、UX 檢查文件
```

**Structure Decision**: 維持單體 Next.js 結構，API 以 Route Handlers 提供本機檔案/LowDB 作業，契約對齊 OpenAPI 3.1；測試集中於 tests/（contract/integration/unit）。

## Complexity Tracking

無需例外複雜度，暫無條目。

## Phase 0 - Outline & Research

- 未列 NEEDS CLARIFICATION 項目；針對核心決策（雙層儲存、檔名合法化、衝突處理、效能門檻、本機日誌策略、localStorage 偏好、驗證格式）彙整於 research.md，依「Decision / Rationale / Alternatives considered」格式。
- 研究檔產出：更新 [research.md](research.md) 以反映最新 Clarifications（含日誌策略 NFR-003）。

## Phase 1 - Design & Contracts

- 資料模型：更新 [data-model.md](data-model.md)（實體欄位、驗證規則、狀態轉換）。
- 契約：更新 [contracts/openapi.yaml](contracts/openapi.yaml) 與 [contracts/api.md](contracts/api.md)，涵蓋 inbox/projects/prompts/snippets/search/settings，含衝突/驗證錯誤碼與時間/檔名規範。
- 快速開始：更新 [quickstart.md](quickstart.md)，涵蓋 rootPath、日誌策略、遙測/更新設定、快捷鍵、測試指令。
- rootPath/時間規範：在 schema/契約中明確 rootPath 驗證（使用者目錄、非空、持久化）與全實體 createdAt/updatedAt 自動補值（ISO 8601, UTC+08:00），API/檔案回應需帶齊。
- Agent context：執行 `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`，新增當前計畫採用的技術/日誌策略，保留現有手動段落。
- Phase 1 完成後重跑 Constitution Check（語言/測試/效能/UX）。

## Phase 2 - Implementation Planning（預告）

- 依 research/design 輸出 /speckit.tasks 以產生 tasks.md：
  - API/檔案層：autosave 2 秒、檔名合法化、Frontmatter 驗證、衝突偵測三選。
  - UI：Pin/寬度持久化、三欄佈局、快捷鍵、專注模式、Undo/snackbar、片語 Drawer。
  - 設定：rootPath API/UI/持久化與錯誤處理（使用者目錄限制、LowDB+localStorage），保存後觸發資料刷新。
  - 日誌：結構化本機循環檔案 + console mirror，遮蔽敏感欄位；設定可停用遙測/更新。
  - 測試：契約 + 整合 + 單元覆蓋 ≥80%，關鍵路徑 100%，含衝突/截斷/快捷鍵/Undo/片語插入量測。
  - 時間欄位：所有實體建立/更新時自動補齊 createdAt/updatedAt（ISO 8601, UTC+08:00），API/檔案/LowDB/前端顯示一致，缺值自動填補。

> Phase 2 細項將於 /speckit.tasks 流程產出，不在本階段生成。
