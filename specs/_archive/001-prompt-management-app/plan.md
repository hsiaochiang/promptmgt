# Implementation Plan: Prompt Management App GUI Fixes（已完成）

> Status: Archived（歷史文件）
> 
> 最新規格/計畫請改看：`specs/001-local-prompt-manager/spec.md`、`specs/001-local-prompt-manager/plan.md`

**Branch**: `001-prompt-management-app` | **Date**: 2025-12-28 | **Spec**: `/specs/_archive/001-prompt-management-app/spec.md`
**Scope**: 本文件原先用於補齊早期 GUI 缺口；對應功能已在 `001-local-prompt-manager` 分支落地並通過測試門檻。

## Summary

已完成並驗收（以 prototype 與 contract/integration 測試為準）：

- 主工作台可新增並編輯收件匣草稿（自動儲存）。
- 可從 UI 新增專案並立即選取；提示詞列表可正確載入/刷新。
- 草稿可在 UI 內轉正到專案（寫入 frontmatter），並自收件匣移除。
- 提示詞列表空狀態指引完成；片語插入具備明確回饋（toast）。

後續延伸（已成為產品基線，不再視為「GUI 缺口」）：

- Topbar actions：隱藏片語（切換右側片語庫顯示）、設定、今日變更報告。
- Settings：logPath 允許位於使用者目錄或 rootPath 下，並提供快捷按鈕。

## Technical Context

- **Language/Framework**: TypeScript, Next.js 14 App Router, React 18, TailwindCSS, Zustand。
- **Storage**: LowDB（`db.json`）＋檔案系統 Markdown（`Prompts/{Project}/{SafeTitle}.md`）。
- **APIs**: App Router route handlers（projects/inbox/prompts/snippets/settings/search）。
- **Editor**: CodeMirror (`@uiw/react-codemirror`) with `@codemirror/lang-markdown`。
- **Testing**: Vitest（contract/unit/integration），覆蓋率門檻 80%+。
- **Platform**: 桌面瀏覽器（本機開發/打包），無伺服端部署需求。

## Constitution Check

- 符合現有架構；無新增外部服務或風險項。

## Project Structure（實際路徑）

```text
app/
  (workspace)/
   workspace-shell.tsx        # 主工作台（需接 DraftEditor、歸檔 UI）
   inbox-workspace.tsx       # 獨立收件匣頁（參考 DraftEditor 用法）
   actions/archiveDraft.ts   # 草稿轉正 server action
   components/
    project-list.tsx        # 專案列表（需新增專案入口）
    inbox-list.tsx          # 收件匣列表（已有新增草稿）
    draft-editor.tsx        # 草稿編輯（自動儲存）
    prompt-list.tsx         # 提示詞列表（需刷新/空狀態）
    prompt-editor.tsx       # 提示詞編輯器
    prompt-header.tsx       # 複製按鈕
    snippet-panel.tsx       # 片語面板（需插入回饋）
  api/...
lib/...
tests/{contract,integration,unit}/...
```

## Plan / Steps（歷史記錄）

1) **接入草稿編輯到主畫面**  
  - `workspace-shell.tsx`: 新增草稿後同步 `selectedPromptId`，並在右側切換至 `DraftEditor`（show 標題/提示/內容）。
  - UI 狀態：顯示「收件匣模式」標示，避免和正式提示詞混淆。

2) **新增專案 UI**  
  - `project-list.tsx`: 加「新增專案」按鈕+對話框（名稱、描述、狀態：規劃中/進行中/已結案/暫停）。
  - 提交 `/api/projects` 後：刷新列表，預設選取新專案，更新提示詞列表。

3) **草稿轉正（歸檔）UI**  
  - 在 DraftEditor 或草稿卡片加入「歸檔」按鈕 → 對話框填寫標題/標籤/狀態/模型/目標專案。
  - 呼叫 `archiveDraft`：寫入 frontmatter（含 `project`）與檔案後移除草稿；刷新收件匣計數、專案計數、提示詞列表，並選取新提示詞。

4) **提示詞列表刷新與空狀態**  
  - `prompt-list.tsx`: 轉正或新增提示詞後自動 `fetch` 並聚焦新項目。
  - 無專案或無提示詞時，顯示空狀態指引：「請先建立專案或將草稿轉正」。

5) **片語插入回饋**  
  - `snippet-panel.tsx`: 點擊插入後顯示輕量提示（如 toast/inline 標籤），確保使用者知道插入成功。

6) **文件同步**  
  - 本計畫已完成；後續請以 `specs/001-local-prompt-manager/spec.md` 與同資料夾內文件作為最新來源。

7) **測試與驗證**  
  - 以 `npm test` 全套測試與 coverage gate 作為交付門檻。

## Risks / Mitigations

- **狀態切換錯位**：新增草稿後若未切換到 DraftEditor，仍無法編輯 → 同步選取 ID 並分支渲染。
- **轉正後列表未刷新**：確保 `fetchPrompts` 支援外部觸發（可用 refresh key state），並在 action 後觸發。
- **表單驗證不足**：專案/轉正表單需最基本欄位必填與檔名合法性（沿用 `sanitizeFilename`）。

## Deliverables（已交付）

- 可在主畫面新增並編輯收件匣草稿。
- 可從 UI 新增專案並立即選取，提示詞列表正常載入。
- 草稿可在 UI 內轉正到指定專案並出現在提示詞列表。
- 空狀態指引與片語插入回饋完成。

