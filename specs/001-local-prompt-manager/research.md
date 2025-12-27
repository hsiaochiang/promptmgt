# Research（Phase 0）

本文件收斂本次 feature 的技術決策，並以 `spec.md` 的 Clarifications（Session 2025-12-27）為準。

## 決策與依據

### UI/UX 權威來源
- **Decision**：UI/UX 以 `0resource/prototype/` 的互動與版面為準；資料層（rootPath/frontmatter/衝突偵測）沿用現有系統。
- **Rationale**：避免規格與原型分叉；同時不推翻既有檔案儲存與衝突處理能力。
- **Alternatives considered**：以 spec 推導新 UI（容易與原型不一致）。

### Markdown 預覽呈現
- **Decision**：Prompt Detail 在 Main 區塊採「編輯 / 預覽」Tabs 互斥切換。
- **Rationale**：與固定 Main/Side Shell 相容、成本低、驗收清晰。
- **Alternatives considered**：左右分割同時顯示（版面成本高）；Modal/Drawer（偏離原型）。

### 自動儲存（2 秒）
- **Decision**：2 秒 debounce；無輸入暫停計時，恢復輸入再計時。
- **Rationale**：降低資料遺失；避免頻繁 I/O；符合既有 autosave 行為。
- **Alternatives considered**：立即儲存（I/O 過密）；>3 秒（風險提高）。

### 刪除 + Undo（5 秒）
- **Decision**：刪除流程為 Confirm → Snackbar Undo（5 秒）。5 秒內視作「soft delete（deferred delete）」：先在 UI 標記待刪並啟動倒數，逾時才呼叫實際 DELETE；Undo 則取消倒數並復原 UI。
- **Rationale**：符合原型體驗且避免不可逆檔案刪除造成資料損失。
- **Alternatives considered**：立即永久刪除（Undo 形同虛設）；封存/隱藏（需求不同）。

### 衝突（409/外部修改）處理
- **Decision**：偵測到衝突（hash/mtime 或 draft updatedAt 不一致）時，UI 必須提示並提供三選一：
	1) 重新載入  2) 另存副本  3) 強制覆寫
- **Rationale**：避免靜默覆蓋；讓使用者控制資料風險；符合 Clarifications。
- **Alternatives considered**：最後寫入者勝（高風險）；自動 merge（複雜且不可靠）。

### timestamps（UTC+08:00 ISO 8601）更新規則
- **Decision**：createdAt 僅首次建立；每次成功儲存（含 autosave）都更新 updatedAt。
- **Rationale**：符合稽核/排序需求；驗收與使用者直覺一致。
- **Gap（現況差距）**：提示詞更新 API 目前會接受 client 端的 `frontmatter.updatedAt`；需在 Phase 2 規劃中將「updatedAt 由伺服端主導」落地，避免用戶端漏傳導致不更新。

### 儲存策略（既有系統）
- **Decision**：沿用 LowDB（`db.json`）保存 projects/inbox/snippets/settings；提示詞與 README 以 `rootPath` 下的 Markdown 檔保存（YAML frontmatter + body）。
- **Rationale**：列表/設定查詢快；檔案格式開放且可外部編輯。
- **Alternatives considered**：純檔案掃描（效能與排序成本高）；SQLite（超出本次範圍）。

## 待落實的實務要點（供 Phase 2 拆 task）

- 契約：OpenAPI 需對齊實際 Route Handlers（method/path/錯誤碼/409 回傳細節）。
- 錯誤 UX：衝突時的三個操作需對應到實際行為（重新載入＝重新 GET；強制覆寫＝忽略 expectedHash/expectedMtime 或以最新值重送；另存副本＝建立新提示詞/新檔名）。
- 刪除 Undo：以 UI deferred delete 實作（避免 API 需要真正的 soft delete 資料模型）。
