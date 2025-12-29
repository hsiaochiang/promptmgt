# Data Model（Phase 1）

> 本文件以 `spec.md` 的需求為準，並對照現行資料層（Zod schema / FS 儲存）規劃升級路徑。

## 共用型別

### TaxonomyValue

```ts
type TaxonomyValue = { code: string; name: string };
```

**規則（非選配）**

- API 與持久化需雙寫入 `code` + `name`
- server 必須驗證 `code` 對應的 `name` 是否正確（以內建 taxonomy 表為準）
- 若 `code`/`name` 不一致：回傳 400（validation error），不得靜默修正

## 實體與欄位

### 本次 prototype 對齊必用

### Project（專案）
- `id`: string（必填；現況常見 `proj-xxxxxx`）
- `name`: string（必填、唯一（不分大小寫），<=100，禁用檔名非法字元）
- `status`: TaxonomyValue（必填；允許值：`ACTIVE/PAUSED/ARCHIVED`）
- `summary`: string（必填；預設可由 README 推導，但允許使用者覆寫並持久化；建議 <= 200）
- `projectType`: TaxonomyValue（必填；對齊 prototype taxonomy.projectTypes）
- `tags`: TaxonomyValue[]（必填；對齊 prototype taxonomy.commonTags；需去重）
- `promptCount`: number（>=0）
- `docPath`: string（專案說明 Markdown 路徑，位於專案資料夾）
- `updatedAt`: datetime (ISO 8601, UTC+08:00)
- `createdAt`: datetime (ISO 8601, UTC+08:00)
- `path`: string（可選；rootPath 設定後可推導）
- 關聯：1:N `Prompt`

> Project Detail 的側欄更完整 taxonomy（平台/交付物/受眾/共通）建議持久化於專案資料夾 `_meta.json`，並由 `GET /projects` 彙整必要欄位（`status/summary/projectType/tags`）供列表卡片使用。

### Prompt（提示詞 Markdown 檔案）
- `id`: string（檔案路徑 base64url；用於 API 路由參數）
- `projectId`: string（現況為 project 名稱；亦兼容以 projectId 進行篩選）
- `title`: string（必填，<=200，禁用檔名非法字元）
- `type`: string（必填；<=100）
- `status`: string（必填；允許值：`draft/active/archived` 或 `草稿/使用中/已封存`，英中並行）
- `category`: TaxonomyValue（必填；對齊 prototype taxonomy.conversationCategories）
- `promptStage`: TaxonomyValue（必填；對齊 prototype taxonomy.promptStages）
- `model`: string（可選；<=100）
- `platformTags`: TaxonomyValue[]（必填；對齊 prototype taxonomy.platformTags；需去重）
- `audienceTags`: TaxonomyValue[]（必填；對齊 prototype taxonomy.audienceTags；需去重）
- `deliverableTags`: TaxonomyValue[]（必填；對齊 prototype taxonomy.deliverableTags；需去重）
- `tags`: TaxonomyValue[]（必填；對齊 prototype taxonomy.commonTags；需去重）
- `note`: string（可選；<=2000；歷史相容 `notes` → 正規化為 `note`）
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
- 所有 taxonomy array 欄位需去重（以 `code` 不分大小寫作為 key）、trim，並拒絕空值；`code/name` 不一致視為錯誤。  
- `rootPath` 允許為 null；若為 null 或不可存取，UI 需以 RootPathAlert 導向設定頁，且寫入操作不可靜默失敗。  
- Frontmatter 缺失/損壞時需可降級（例如純文字模式）並允許修復。  
- 列表輸出建議限制 1000 筆並提示收斂條件（避免 UI 卡頓）。

## 狀態與轉換
- Prompt `status` 允許中英文枚舉值並行（避免破壞既有資料）。
- Project `status` 以 taxonomy（`ACTIVE/PAUSED/ARCHIVED`）為準；若需相容舊值，應在 migration 階段明確映射並一次性清理。
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
