---

description: "Task list for 001-prompt-management-app GUI fixes"
---

# Tasks: Prompt Management App（GUI 缺口補齊）

**Input**: `/specs/001-prompt-management-app/spec.md`（已標註 GUI 缺口）
**Prerequisites**: plan.md（本檔案同目錄），既有 APIs 已可用（projects/inbox/prompts/snippets/settings）。

## 格式: `[ID] [P?] Description`
- **[P]**: 可平行（不同檔案、無依賴）

## Phase A: 收件匣編輯可用
- [ ] T100 [P] WorkspaceShell 接入 DraftEditor：新增草稿後同步 `selectedPromptId` 並在右側渲染標題/提示/內容三欄。
- [ ] T101 顯示「收件匣模式」標示，避免與正式提示詞混淆。

## Phase B: 專案建立入口
- [ ] T110 在 `app/(workspace)/components/project-list.tsx` 加「新增專案」按鈕與表單（名稱、描述、狀態）。
- [ ] T111 送出 `/api/projects` 後刷新列表並自動選取新專案，觸發提示詞列表刷新。

## Phase C: 草稿轉正 UI
- [ ] T120 在草稿編輯區新增「歸檔」按鈕→對話框填寫標題/標籤/狀態/模型/目標專案。
- [ ] T121 呼叫 `archiveDraft` 後：移除草稿、更新收件匣計數、更新專案計數、刷新提示詞列表並選取新提示詞。

## Phase D: 提示詞列表體驗
- [ ] T130 提示詞列表支援外部觸發刷新（轉正/新增後自動重新 fetch 並聚焦新項）。
- [ ] T131 無專案或無提示詞時顯示空狀態指引（請建立專案或將草稿轉正）。

## Phase E: 片語插入回饋
- [ ] T140 在 `snippet-panel.tsx` 點擊插入後顯示「已插入」輕量提示（toast/inline 標籤），同時維持使用次數更新。

## Phase F: 測試與驗證
- [ ] T150 Integration：新增草稿→主畫面可編輯並自動儲存。
- [ ] T151 Integration：新增專案後可選取且提示詞列表刷新。
- [ ] T152 Integration：草稿轉正後出現在提示詞列表並移除收件匣。
- [ ] T153 Unit/contract：若新增表單驗證或回饋元件，補最小渲染/行為測試。
