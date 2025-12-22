# Research（Phase 0）

## 決策與依據

### 自動儲存間隔
- **Decision**: 草稿與提示詞自動儲存間隔 2 秒，無輸入時暫停計時，恢復輸入後重新計時。
- **Rationale**: 2 秒提供低摩擦編輯體驗並降低資料遺失風險；符合現行 hook 預設節奏，避免頻繁 I/O。
- **Alternatives considered**: 3–5 秒（降低 I/O 但風險增加）；立即儲存（I/O 過於頻繁且可能阻塞）。

### 雙層儲存策略
- **Decision**: 持續使用 LowDB 作為索引/設定，Markdown 檔案作為正文來源。
- **Rationale**: 兼顧快速列表/設定查詢與開放檔案格式；符合「本機所有權」與外部編輯相容要求。
- **Alternatives considered**: 單一檔案系統（列表效能較差）；SQLite（增設依賴且與開放 Markdown 目標不符）。

### 檔名合法化
- **Decision**: 以 `sanitizeFilename` 清理標題產生檔名，保留顯示實際儲存名稱給使用者。
- **Rationale**: 滿足 Edge Case 禁用字元需求，避免寫檔失敗。
- **Alternatives considered**: 直接拒絕非法字元（提升阻力）；自動移除但不告知（降低透明度）。

### 外部修改衝突處理
- **Decision**: 發現 hash/mtime 衝突時提示三選（載入外部 / 保留本地 / 檢視差異）。
- **Rationale**: 覆蓋風險高，需用戶決策；對應規格 Clarification。
- **Alternatives considered**: 直接覆寫或拒絕寫入（皆不符合規格）。

### 本機觀測性策略（遙測/紀錄）
- **Decision**: 採「本機暫存、可匯出」：以 console + 環迴記憶體 buffer（輪替檔案 telemetry/log 最大 5MB），預設不外傳；設定頁提供匯出診斷檔並可停用匿名遙測。
- **Rationale**: 僅 localhost 執行且資料敏感，需可調試但不得外送；滿足 NFR-001 並符合離線要求。
- **Alternatives considered**: (1) 零遙測—調試難；(2) 即時上傳外部服務—違反隱私與離線假設。

### 檔案/LowDB 寫入一致性
- **Decision**: API 層集中序列化寫入（per-resource queue/mutex），寫入前後以 mtime/hash 驗證；衝突交由上方彈窗決策。
- **Rationale**: 降低並發覆寫與 LowDB 損毀風險，保持現有技術棧；跨平台 file lock 複雜度高。
- **Alternatives considered**: OS file lock（跨平台難維護）；改用 SQLite（超出範圍且重構成本高）。

### localStorage 偏好同步（Pin/寬度）
- **Decision**: 單 key JSON（例 `pm-settings`），載入時 schema 驗證 + 版本遷移；寫入節流 300–500ms，故障 fallback 預設值。
- **Rationale**: 減少 key 分散導致版本漂移；節流避免頻繁 IO；提升回復能力。
- **Alternatives considered**: 多 key 分散（易失配）；IndexedDB（需求單純不需索引）。

### API 介面形式
- **Decision**: 延續 Next.js Route Handlers REST 風格，對應 inbox/projects/prompts/snippets/search/settings；合約以 OpenAPI 3.1 描述。
- **Rationale**: 與現有路由一致，維持低複雜度；便於契約測試與前後端對齊。
- **Alternatives considered**: GraphQL（過度設計）；tRPC/RPC（需重構現有 REST 路徑）。

### 驗證與錯誤處理
- **Decision**: 使用 zod schema 共享於 API/前端，錯誤格式 `{code,message,details}`；檔名/Frontmatter 驗證集中在 lib 層，UI 提供可修復提示。
- **Rationale**: 單一來源減少重複；符合契約測試需求；便於本地化訊息。
- **Alternatives considered**: 手寫驗證（易漏）；Yup（與現況不一致）。

### 效能守則
- **Decision**: 列表 lazy 分頁 + 記憶體快取；搜尋最多 1000 筆並提示收斂；自動儲存 debounce 2 秒，idle 暫停；Pin 收合 CSS transition 200ms（buffer 50ms）。
- **Rationale**: 滿足 SC-001~SC-015 的 SLA；避免重算成本。
- **Alternatives considered**: 全量即時計算（成本高）；內建全文索引（目前規模無需）。

### 安全與存放策略
- **Decision**: 儲存於使用者目錄下隱藏資料夾，沿用 OS 權限，預設無應用層加密；危險操作需確認 + undo 5–10 秒。
- **Rationale**: 符合 Clarification 選項 B，無額外密鑰管理負擔。
- **Alternatives considered**: AES-256 應用層加密（超出需求）；公開於共享路徑（違反隱私）。

### 時間欄位與時區策略
- **Decision**: 所有實體（Project/Prompt/Inbox/Snippet/Settings）必備 `createdAt`/`updatedAt`，儲存格式為 ISO 8601（UTC+08:00，固定偏移，不採夏令時間），缺值由系統自動補值；UI 顯示 `MM/DD HH:mm`，編輯器標題列顯示 `HH:mm`。
- **Rationale**: 與 FR-034/FR-035、SC-021 對齊；固定偏移可避免 DST 轉換誤差，序列化/驗證一致降低前後端落差。
- **Alternatives considered**: 儲存 UTC Z + 轉換顯示（需額外轉換且易混用 Z/偏移）；允許缺 `createdAt`（違反稽核需求）。

## 待落實的實務要點

- Route Handlers 寫入需集中序列化，避免客戶端直寫檔案。
- localStorage/檔案資料載入需執行 schema 驗證與版本遷移（含 fallback）。
- 衝突彈窗提供「載入外部 / 保留目前 / 檢視差異」，並記錄本機 Telemetry。
- Quickstart 必須說明根路徑與隱藏資料夾位置、診斷匯出步驟。
- 契約需列出錯誤碼（衝突、驗證錯、檔案不存在、路徑失效）。
- Perf：列表/搜尋>1000 筆截斷並提示；自動儲存與 Pin 收合滿足 p95 指標。
