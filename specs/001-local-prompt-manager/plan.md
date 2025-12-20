# Implementation Plan: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

## 目標與對齊
- 嚴格落實雙層儲存：LowDB 儲存 Projects/Inbox/Snippets/Settings，Markdown 檔案儲存 Prompt 內容＋Frontmatter。
- API（Next.js App Router Server Actions + Route Handlers）完整支援 ui_prototype.jsx 所需欄位，保持 Tailwind 樣式不動，視覺 1:1。
- 預設允許匿名遙測與更新檢查（可設定停用），滿足 Clarifications/NFR。

## 架構與資料流
- 前端：React + App Router，Zustand 管選取的 projectId/promptId、搜尋/篩選狀態、編輯器內容暫存、UI 面板開合。
- 服務層：Server Actions/Route Handlers 呼叫 LowDB Adapter 與 FileSystem Adapter。
- 儲存分工：
  - LowDB (db.json)：projects, inbox, snippets, settings（含 rootPath）。promptCount/updatedAt 以掃描檔案系統或快取後更新。
  - File System：/Prompts/{ProjectName}/{SafeTitle}.md，內容含 YAML Frontmatter（title/project/type/status/model/tags/updatedAt/notes）。
- 同步流程：
  - 啟動時載入 settings.rootPath；不存在則引導設定。
  - 列表讀取：projects/inbox/snippets 從 LowDB；prompts 透過掃描檔案系統解析 Frontmatter。
  - 草稿轉正：移除 LowDB.inbox -> 寫入 Markdown -> 回填專案計數。
  - 外部變更偵測：文件 mtime/哈希對比；若與本地編輯衝突，彈窗「載入外部/保留當前/檢視差異」。
  - 遙測/更新檢查：啟動時依設定決定是否發送，提供設定頁可停用。

## 資料模型驗證（LowDB）
- projects: { id, name, status, lastSyncedAt, promptCount (計算或快取), updatedAt (掃描後寫回) }
- inbox: { id, title, content, hint, createdAt, updatedAt }
- snippets: { id, name, category, content, usage }
- settings: { rootPath, telemetryEnabled (default true), updateCheckEnabled (default true) }
- 確認包含 Prototype 欄位：Inbox.hint、Snippet.usage；Project.status/promptCount/updatedAt；Prompt.list 欄位 type/status/model/tags/updatedAt。

## Frontmatter / 檔案命名
- Frontmatter 至少：title, project, type, status, model, tags, updatedAt, notes。
- 檔名安全化：替換 / \ : * ? " < > | 及空白規則（如空白轉 -，重複檢測重名）。
- 版本／歷史：依 Git 讀取時可擴充，不影響 MVP。

## API / Server Actions 對齊 Prototype
- GET /api/projects：來源 LowDB；回傳 id/name/status/promptCount/updatedAt。
- GET /api/inbox：來源 LowDB；回傳 id/title/content/hint/createdAt/updatedAt。
- GET /api/prompts?projectId=...：掃描檔案系統，解析 Frontmatter 回傳列表（id, title, type, status, model, tags, updatedAt, projectId）。
- GET /api/prompts/[id]：讀檔案＋Frontmatter＋body。
- POST /api/prompts/save：保存編輯器內容（含 Frontmatter）到檔案；返回 updatedAt。
- POST /api/prompts/archiveDraft：從 inbox 移除，寫入檔案，回填專案計數。
- POST /api/snippets/usage：使用次數 +1，回傳最新 usage。
- POST /api/settings/rootPath：更新根路徑並重新掃描。
- POST /api/search：全文搜尋（標題/內容/標籤），限制 1000 筆並提示收斂。
- Telemetry/更新檢查：行為封裝在 /api/telemetry 或開機 routine；遵守設定開關。

## 元件拆解與 Prototype 對映
- layout.tsx：全域骨架，套用 min-h-screen bg/text。
- TopBar.tsx：頭部含 PM 標誌、標語、按鈕（今日變更報告/新增提示詞）。
- Sidebar/
  - ProjectList.tsx：專案卡片樣式（選取用 border-slate-900 bg-slate-900 text-white）。
  - InboxList.tsx：虛線黃框（border-dashed border-amber-300），顯示 hint/createdAt。
- PromptListPanel.tsx：
  - SearchBar：搜尋輸入框 + 篩選按鈕 + 進行中/全部切換。
  - PromptList：列表卡片，顯示 type/status/model/tags/updatedAt，選取樣式 bg-slate-900/5。
- WorkspacePanel.tsx：
  - PromptHeader：目前編輯中、複製完整/精簡、快捷提示，狀態/模型/專案 pill。
  - Editor：CodeMirror，高度 flex-1；頂部狀態列顯示自動儲存＋最後時間。
  - SnippetPanel：搜尋、列表（usage、category、點擊插入），維持 border/bg/字級。
- 分隔條：兩側 w-[3px] cursor-col-resize 保留。
- 保留 ui_prototype.jsx 內所有 Tailwind class 作為樣式來源，僅拆檔不改 class。

## 狀態管理 (Zustand)
- selectedProjectId, selectedPromptId
- searchQuery, filterStatus (進行中/全部)
- editorContent, editorDirty, lastSavedAt
- inboxCount, promptsMeta (列表快取)
- ui: isSnippetPanelOpen, isLoading (paste >100KB 時)
- settings: rootPath, telemetryEnabled, updateCheckEnabled

## 關鍵工作流
1) 啟動載入：讀 settings -> 若 rootPath 缺失，引導設定；並載入 projects/inbox/snippets + 掃描 prompts。
2) 草稿轉正：Server Action 移除 inbox、寫檔、更新計數、回傳新列表。
3) 編輯與保存：前端自動保存節流（例如 3 秒），Server Action 寫檔並回傳 updatedAt；快捷鍵 Ctrl/Cmd+S 觸發保存。
4) 外部修改衝突：啟動檔案監聽或定期檢查 mtime；有衝突時彈窗三選。
5) 精簡/完整複製：Server 無需參與，前端根據內容/Frontmatter 切片。
6) Snippet 插入與計數：點擊將 content 插入編輯器游標；後台打 usage API。
7) 搜尋：Server Action 掃描檔案（含內容）+ LowDB 標籤，限制 1000 筆，回傳高亮片段或偏移。

## 風險與對策
- 檔名衝突/非法字元：統一 Sanitizer；若重名加編號後綴。
- 大型貼上卡頓：paste >100KB 顯示 loading 並延後 render。
- 遙測/更新爭議：預設開啟但提供設定關閉；不收集內容本文。
- 外部移動/刪除專案路徑：載入時提示重新定位或移除壞專案。

## 里程碑與任務
1. 基礎設置：Next.js + Tailwind + shadcn + Zustand；建立 db.json、rootPath 設定頁；建立 LowDB/File adapters。
2. API/Server Actions：projects/inbox/snippets/settings；prompts 列表/讀寫；搜索；草稿轉正。
3. UI 刻板拆解：依 Prototype 拆元件並套用 class；整合狀態與 API。
4. 編輯器整合：CodeMirror + 自動保存 + 複製模式；大貼上 loading。
5. 片語與使用次數：搜尋、插入、usage API。
6. 外部變更偵測與衝突彈窗；檔名/Frontmatter 驗證；搜尋上限提示。
7. 設定與遙測：新增設定頁切換 telemetry/update；預設開啟。
8. 測試：單元（adapters）、整合（API flows）、E2E（草稿→轉正→編輯→複製→搜尋），性能驗證（1000 prompts 查詢 <2s）。
