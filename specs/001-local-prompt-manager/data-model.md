# Data Model（Phase 1）

## 實體與欄位

### Project（專案）
- `id`: string（uuid v4）
- `name`: string（必填、唯一，<=100）
- `status`: enum [`active`,`planned`,`archived`]（對應 進行中/規劃中/已結案）
- `promptCount`: number（>=0）
- `docPath`: string（專案說明 README 路徑，位於專案資料夾）
- `updatedAt`: datetime (ISO 8601, UTC+08:00)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `path`: string（檔案系統路徑，可由 name 推導與 sanitize）
- 關聯：1:N `Prompt`

### Prompt（提示詞 Markdown 檔案）
- `id`: string（uuid v4）
- `projectId`: string（Project.id）
- `title`: string（必填，<=200）
- `type`: string（enum/自由字串，對應 spec 類型）
- `status`: enum [`draft`,`active`,`archived`]（對應 UI 狀態）
- `model`: string（可選，例如 gpt-4o, claude）
- `tags`: string[]（去重，單一標籤長度 <=50）
- `note`: string（可選）
- `content`: string（Markdown 本體）
- `frontmatter`: object（序列化用：title/project/type/status/model/tags/note/updatedAt）
- `updatedAt`: datetime (ISO 8601, UTC+08:00)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `path`: string（檔案路徑，經 sanitizeFilename）
- 衍生：`preview`（前 50 字）

### InboxItem（收件匣草稿）
- `id`: string（uuid v4）
- `title`: string（可空，<=200）
- `content`: string（Markdown）
- `hint`: string（可選，備註）
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

### Snippet（片語）
- `id`: string（uuid v4）
- `name`: string（必填，<=120）
- `category`: string（可選，分類用）
- `content`: string
- `usageCount`: number（>=0）
- `lastUsedAt`: datetime (ISO 8601, UTC+08:00 | 可空)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

### Settings（設定）
- `rootPath`: string（必填；啟動時驗證存在與可寫）
- `pinned`: boolean（Pin 狀態，預設 true）
- `layout`: object `{ leftWidth:number, middleWidth:number }`（寬度百分比/px，持久化於 localStorage）
- `fontScale`: number（預設 +2px；允許覆蓋）
- `telemetry`: object `{ enabled:boolean, exportPath?:string }`
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

## 驗證規則
- 所有 `id` 使用 uuid v4。  
- 標題/名稱不得含檔名禁用字元 `/ \ : * ? " < > |`；寫檔前必須經 `sanitizeFilename`。  
- 所有時間欄位強制使用 ISO 8601（UTC+08:00）；解析/序列化需驗證偏移存在，缺值由系統自動補值。  
- 標籤/分類需去重、trim、禁止空白字串。  
- `rootPath` 必須存在且可寫；不存在時阻擋啟動並提示設定。  
- localStorage 設定載入需通過 zod schema，失敗則回退預設。  
- Frontmatter 缺失/損壞時以純文字模式降級並允許修復。  
- 列表輸出限制 1000 筆並提示收斂條件。

## 狀態與轉換
- InboxItem → Prompt：透過「轉正」，生成檔案並從收件匣移除。  
- Prompt `status`: `draft`→`active`→`archived`（允許直接 `active`→`archived`）；轉換時更新 Frontmatter 與檔案。  
- Project `status`: `planned`↔`active`↔`archived`；切換後需刷新提示詞計數。  
- Snippet `usageCount/lastUsedAt`：插入時自動 +1 並更新時間。  
- Pin 狀態：預設 ON，localStorage 持久化並跨專案沿用；OFF 時列表點擊自動收合。

## 事件與派生資料
- 前端列表快取：`preview`（前 50 字）、`updatedAt` 用於排序。  
- Telemetry（本機）：記錄 CRUD、衝突對話框選擇、搜尋/插入耗時（僅本機檔案，無上傳）。  
- 檔案/LowDB 寫入：以 mtime/hash 驗證，衝突時產生事件供 UI 彈窗。

## 關聯圖（文字）
- Project 1 — N Prompt（projectId）  
- InboxItem 無關聯，轉正時生成 Prompt 並更新 Project 計數  
- Snippet 與 Prompt 無直接外鍵，但插入動作影響 usageCount  
- Settings 為全域單例，驅動路徑/偏好/觀測性設定
