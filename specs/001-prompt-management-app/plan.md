# Implementation Plan: Prompt Management App GUI Fixes

**Branch**: `001-prompt-management-app` | **Date**: 2025-12-20 | **Spec**: `/specs/001-prompt-management-app/spec.md`
**Scope**: 補齊 GUI 缺口（收件匣編輯、專案新增、草稿轉正、提示詞列表刷新/空狀態、片語插入回饋）。

## Summary

落地目前 spec 中未完成的 GUI：
- 新增草稿後可直接在主畫面編輯（接入 DraftEditor）。
- 專案可從 UI 新增並立即選取；提示詞列表能載入該專案內容。
- 草稿可在 UI 內轉正到專案，寫入 frontmatter 並刷新列表。
- 提示詞列表提供空狀態指引並在轉正/新增後自動聚焦；片語插入有明確回饋。

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

## Plan / Steps

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
  - 更新 `spec.md` 的 GUI 缺口狀態（已標注）。
  - 更新 `tasks.md`（新增本階段任務）並在 PR 描述引用。

7) **測試與驗證**  
  - 新增/更新 integration test：草稿轉正後出現在提示詞列表；專案新增後可被選取；草稿可於主畫面編輯並自動儲存。
  - 單元/契約：若新增表單驗證或回饋元件，補基本渲染測試。

## Risks / Mitigations

- **狀態切換錯位**：新增草稿後若未切換到 DraftEditor，仍無法編輯 → 同步選取 ID 並分支渲染。
- **轉正後列表未刷新**：確保 `fetchPrompts` 支援外部觸發（可用 refresh key state），並在 action 後觸發。
- **表單驗證不足**：專案/轉正表單需最基本欄位必填與檔名合法性（沿用 `sanitizeFilename`）。

## Deliverables

- 可在主畫面新增並編輯收件匣草稿。
- 可從 UI 新增專案並立即選取，提示詞列表正常載入。
- 草稿可在 UI 內轉正到指定專案並出現在提示詞列表。
- 空狀態指引與片語插入回饋完成。

