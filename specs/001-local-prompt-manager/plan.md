# 原型對齊 Implementation Plan：提示詞工作台（UI/UX 以 prototype 為準）

**Branch**: `001-local-prompt-manager` | **Date**: 2025-12-27 | **Spec**: [specs/001-local-prompt-manager/spec.md](specs/001-local-prompt-manager/spec.md)

## 目標

以 `0resource/prototype/` 的畫面與互動為 UI/UX 權威來源，讓實作計畫聚焦在：

- Tabs（專案/提示詞/剪貼簿）+ Main/Side 兩欄 Shell
- Confirm + Snackbar Undo（5 秒）+ Toast 的一致回饋
- 五個頁面（Projects / Project Detail / Prompts / Prompt Detail / Scratchpad）的互動一致

同時，檔案系統、rootPath、Frontmatter 等非 UI/UX，沿用現有系統資料層（Markdown + YAML frontmatter、rootPath 設定頁、衝突偵測等）。

## In Scope（本次落地範圍）

### A. 導覽與版型（原型一致）

- Topbar + Tabs：專案 / 提示詞 / 剪貼簿
- Shell：Main + Side
- 操作指引（Help）與新增提示詞入口

### B. Projects + Project Detail（原型一致）

- 專案列表與篩選（狀態/分類/標籤；搜尋可先視為示意）
- 專案詳情：提示詞清單、檔案列表、進度紀錄
- 危險操作：Confirm → Snackbar Undo（5 秒）

### C. Prompts + Prompt Detail（原型一致 + 補齊必要能力）

- 提示詞列表與篩選（分類/階段/平台/共通標籤）
- 提示詞編輯：沿用原型版面與 Side Panel 欄位，並補入
  - Markdown 編輯器 + 預覽（語法高亮）
  - 自動儲存（2 秒；無輸入暫停計時）
  - 完整/精簡複製（含 Frontmatter / 去除 Frontmatter）

### D. Scratchpad（原型一致）

- 新增/編輯/複製/刪除剪貼簿項目
- 刪除採 Confirm + Snackbar Undo（5 秒）

### E. 設定與資料層（沿用現有系統）

- rootPath：設定頁可輸入並儲存；缺路徑時 RootPathAlert 導引
- 檔案儲存：正式提示詞存為 Markdown + YAML frontmatter
- 專案 README：每個專案維護專案說明 Markdown 檔
- timestamps：所有實體 createdAt/updatedAt（ISO 8601, UTC+08:00）缺值自動補

## Out of Scope（原型未呈現且本次不做）

- 片語 Drawer / 片語庫插入與使用次數統計 UI
- 三欄拖曳寬度、Pin/列表收合、專注模式、全域快捷鍵、全域搜尋等效率功能
- 任何更動既有資料層格式或替換儲存架構

## 實作順序（建議）

1. UI 框架：Topbar + Tabs + Shell + 全域 Toast/Confirm/Snackbar
2. Projects：列表與專案詳情頁面（含 side panel chips 與刪除流程）
3. Prompts：列表 → Prompt Detail（補齊 Markdown/預覽、2 秒 autosave、複製模式）
4. Scratchpad：列表/編輯/複製/刪除 + Undo
5. 設定/資料層對接：rootPath 指引、frontmatter 格式、README 編輯、timestamps 規範一致

## 驗收（對齊原型 + 必要非 UI 規範）

- Tabs/版型/回饋元件行為與原型一致。
- 刪除皆需 Confirm，刪除後 Snackbar Undo（5 秒）。
- Prompt Detail 支援 Markdown 預覽與完整/精簡複製。
- autosave 2 秒行為符合釐清：無輸入不重複觸發、恢復輸入再計時。
- rootPath 可在設定頁修改；缺路徑時 RootPathAlert 導向設定頁。
