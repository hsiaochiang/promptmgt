# Quickstart（Phase 1）

## 環境需求
- Node.js 18+；Windows/macOS（localhost 模式）
- 安裝相依：`npm install`（依專案鎖檔使用 npm/yarn/pnpm）

## 安裝與啟動
1) 安裝依賴：`npm install`。  
2) 設定根路徑：預設為使用者目錄下隱藏資料夾（例：`%USERPROFILE%/.promptmgt` 或 `~/.promptmgt`），啟動時自動建立；可在設定頁修改 `rootPath`。  
3) 遙測/更新/日誌：預設啟用匿名遙測與更新檢查；可在設定頁關閉 `telemetryEnabled`、`updateCheckEnabled`，並調整 `logPath`（僅允許使用者目錄內路徑）。日誌為結構化 JSON，寫入本機循環檔案（預設 `rootPath/logs/app.log`，5MB 旋轉，含 console mirror，遮蔽敏感欄位），不外傳。`INBOX_PAGE_SIZE` 環境變數可覆寫收件匣分頁大小（預設 50）。  
4) 時間格式：所有時間欄位儲存為 ISO 8601（UTC+08:00）；列表/詳情顯示 `MM/DD HH:mm`，編輯器標題列顯示 `HH:mm`。  
5) 啟動開發伺服：`npm run dev` → http://localhost:3000。  
6) 首次載入確認 RootPathAlert 無錯誤；若路徑失效，依提示重新定位。

## 核心操作
- **專案（Projects / Project Detail）**：檢視專案列表 → 進入專案詳情 → 編輯/查看 README（專案資料夾內 `README.md`）。  
- **工作區 Tabs**：TopBar Tabs（Projects / Prompts / Scratchpad）切換 Main/Side 區塊；Scratchpad 可即時編輯、複製或另存為提示詞。  
- **提示詞（Prompts / Prompt Detail）**：點擊提示詞進入詳情，在 Main 區塊以「編輯 / 預覽」Tabs 切換；停止輸入 2 秒自動儲存（無輸入暫停）。  
- **複製模式**：
	- 精簡複製：只複製內容本體（去除 YAML frontmatter）
	- 完整複製：複製 frontmatter + 本體
- **剪貼簿（Scratchpad）**：用於臨時整理文字與另存為提示詞（依 prototype 流程）。  
- **危險操作（刪除/移除）**：Confirm 後顯示 Snackbar Undo（5 秒）；5 秒內可撤銷（deferred delete），逾時才執行永久刪除。

## 衝突（409）處理

當提示詞或 README 被外部修改，導致寫入衝突（409）時，UI 應提供三個選擇：

1) **重新載入**：重新取得最新檔案內容/metadata 後再編輯
2) **另存副本**：以新檔名/新提示詞建立，避免覆蓋原檔
3) **強制覆寫**：以最新狀態重新送出寫入（明確告知會覆蓋外部變更）

## 偏好與儲存
- Pin/寬度/字級等偏好儲存在 localStorage 單一 key（節流寫入），載入失敗回退預設並記錄日誌。  
- 檔案與 LowDB 寫入由 API 層處理；衝突以 409 回應，UI 需提供「重新載入 / 另存副本 / 強制覆寫」並顯示伺服端 hash/updatedAt。  
- 資料存放於使用者目錄隱藏資料夾，沿用 OS 權限，預設無應用層加密；必要時可手動加密目錄或放置在加密磁碟區。

## 遙測與診斷
- 日誌：結構化 JSON，落地本機循環檔案（預設 `rootPath/logs/app.log`，5MB 旋轉，含 console mirror，遮蔽敏感欄位），不外傳；需調查時可直接複製該檔案或在設定頁更新 `logPath`。  
- 事件：記錄 CRUD、衝突對話框選擇、搜尋/插入耗時、設定變更；無外部上傳。  
- 更新檢查：僅在 `updateCheckEnabled` 為 true 時執行；停用即為 no-op。

## 測試
- 合併前/CI（含 coverage 閘門）：`npm run test`  
- 契約測試（不含 coverage 閘門）：`npm run test:contract`  
- 單檔快速驗證（不含 coverage 閘門）：`npm run test:fast -- <test-file>`  
- 型別檢查：`npm run typecheck`  
- 覆蓋率需 ≥80%，關鍵路徑力求 100%。

## 常見錯誤 / 修復
- README 衝突（409）：通常代表檔案被外部編輯；請選擇「重新載入 / 另存副本 / 強制覆寫」其中一個策略再繼續。  
- docPath 走失：專案的 README 會以 `rootPath/Prompts/{專案名稱}/README.md` 重建，重新選擇專案或再次儲存即可修復 docPath。  
