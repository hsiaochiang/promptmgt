# Data Model（Phase 1）

> 本文件以現行程式碼的 Zod schema（`lib/types/schema.ts`）為準。

## 實體與欄位

### 本次 prototype 對齊必用

### Project（專案）
- `id`: string（必填；現況常見 `proj-xxxxxx`）
- `name`: string（必填、唯一（不分大小寫），<=100，禁用檔名非法字元）
- `status`: enum [`planned`,`active`,`archived`,`規劃中`,`進行中`,`已結案`]
- `promptCount`: number（>=0）
- `docPath`: string（專案說明 Markdown 路徑，位於專案資料夾）
- `updatedAt`: datetime (ISO 8601, UTC+08:00)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `path`: string（可選；rootPath 設定後可推導）
- 關聯：1:N `Prompt`

### Prompt（提示詞 Markdown 檔案）
- `id`: string（檔案路徑 base64url；用於 API 路由參數）
- `projectId`: string（現況為 project 名稱；亦兼容以 projectId 進行篩選）
- `title`: string（必填，<=200，禁用檔名非法字元）
- `type`: string（必填；<=100）
- `status`: enum [`draft`,`active`,`archived`,`草稿`,`使用中`,`已封存`]
- `model`: string（可選；<=100）
- `tags`: string[]（去重；單一標籤 <=50）
- `note`: string（可選；<=2000）
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)
- `content`: string（Markdown 本體；僅在詳細讀取時）
- `frontmatter`: object（可選；UI 可用此欄位顯示/編輯）
- `path`: string（可選；實際檔案路徑）
- 衍生：`preview`（可選；列表摘要）

### Settings（設定）
- `rootPath`: string | null（可為 null；由設定頁輸入儲存）
- `pinned`: boolean（預設 true；既有欄位）
- `layout`: object `{ leftWidth?: number, middleWidth?: number }`
- `fontScale`: number（預設 2）
- `telemetryEnabled`: boolean（預設 true）
- `updateCheckEnabled`: boolean（預設 true）
- `telemetry`: object `{ enabled: boolean, exportPath?: string }`
- `logPath`: string（預設 `logs/app.log`；API 會以 rootPath 補全）
- `pathExists`: boolean（可選；由 API 回傳供 UI 顯示 rootPath 可用性）
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

### UI State（未持久化）
- Scratchpad：文字內容（prototype 的剪貼簿頁；現況可作為 UI 狀態或後續擴充成持久化實體）

### 既有但非本次 prototype UI 重點（仍存在於 schema/API）

### InboxItem（收件匣草稿）
- `id`: string（必填；現況常見 `inbox-xxxxxxxx`）
- `title`: string（可空，<=200）
- `content`: string（Markdown）
- `hint`: string（可選，備註）
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

### Snippet（片語）
- `id`: string（必填；現況常見 `snip-xxxxxx`）
- `name`: string（必填，<=120）
- `category`: string（可選；<=120）
- `content`: string
- `usageCount`: number（>=0；既有欄位，與 usage 同步）
- `usage`: number（>=0）
- `lastUsedAt`: datetime (ISO 8601, UTC+08:00 | 可空)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `updatedAt`: datetime (ISO 8601, UTC+08:00)

## 驗證規則
- 標題/名稱不得含檔名禁用字元 `/ \ : * ? " < > |`；寫檔前必須經 `sanitizeFilename`。  
- 所有時間欄位強制使用 ISO 8601（UTC+08:00），缺值自動補齊；解析需驗證偏移存在。  
- `tags` 需去重、trim、禁止空白字串（以 schema transform 保證）。  
- `rootPath` 允許為 null；若為 null 或不可存取，UI 需以 RootPathAlert 導向設定頁，且寫入操作不可靜默失敗。  
- Frontmatter 缺失/損壞時需可降級（例如純文字模式）並允許修復。  
- 列表輸出建議限制 1000 筆並提示收斂條件（避免 UI 卡頓）。

## 狀態與轉換
- Prompt `status` / Project `status` 允許中英文枚舉值並行（避免破壞既有資料）。
- 刪除 + Undo：本次建議採 UI deferred delete（5 秒）；不要求在資料模型新增永久 soft-delete 欄位。

## 事件與派生資料
- 列表快取：`preview` 與 `updatedAt` 可用於排序與分頁。  
- 衝突：檔案更新以 `expectedHash/expectedMtime`（或 draft 的 expectedUpdatedAt）偵測；衝突時回 409 並回傳 current 狀態供 UI 決策。  
- 搜尋：結果 >1000 建議截斷並提示收斂。

## 關聯圖（文字）
- Project 1 — N Prompt（projectId）  
- InboxItem 無直接外鍵，轉正時生成 Prompt 並更新 Project 計數  
- Snippet 與 Prompt 無直接外鍵，但插入動作影響 usageCount  
- Settings 為全域單例，驅動路徑/偏好/觀測性設定
