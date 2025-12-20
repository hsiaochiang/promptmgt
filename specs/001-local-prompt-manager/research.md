# Research（Phase 0）

## 決策與依據

### 自動儲存間隔
- **Decision**: 草稿與提示詞自動儲存間隔 2 秒，無輸入時暫停計時，恢復輸入後重新計時。
- **Rationale**: 2 秒提供低摩擦編輯體驗並降低資料遺失風險；符合現行 hook 範例的預設節奏，避免頻繁 I/O。
- **Alternatives Considered**: 3–5 秒（降低 I/O 但風險增加）；立即儲存（I/O 過於頻繁且可能阻塞）。

### 雙層儲存策略
- **Decision**: 持續使用 LowDB 作為索引/設定，Markdown 檔案作為正文來源。
- **Rationale**: 兼顧快速列表/設定查詢與開放檔案格式；符合「本機所有權」與外部編輯相容要求。
- **Alternatives Considered**: 單一檔案系統（列表效能較差）；SQLite（增設依賴且與開放 Markdown 目標不符）。

### 檔名合法化
- **Decision**: 以 `sanitizeFilename` 清理標題產生檔名，保留顯示實際儲存名稱給使用者。
- **Rationale**: 滿足 Edge Case 禁用字元需求，避免寫檔失敗。
- **Alternatives Considered**: 直接拒絕非法字元（提升阻力）；自動移除但不告知（降低透明度）。

### 外部修改衝突處理
- **Decision**: 發現 hash/mtime 衝突時提示三選（載入外部 / 保留本地 / 檢視差異）。
- **Rationale**: 覆蓋風險高，需用戶決策；對應規格 Clarification。
- **Alternatives Considered**: 直接覆寫或拒絕寫入（皆不符合規格）。
