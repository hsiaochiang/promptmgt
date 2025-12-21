# Quickstart（Phase 1）

## 環境需求
- Node.js 18+；Windows/macOS（localhost 模式）
- 安裝相依：`npm install`（依專案鎖檔使用 npm/yarn/pnpm）

## 安裝與啟動
1) 安裝依賴：`npm install`。  
2) 設定根路徑：預設為使用者目錄下隱藏資料夾（例：`%USERPROFILE%/.promptmgt` 或 `~/.promptmgt`），啟動時自動建立；可在設定頁修改 `rootPath`。  
3) 遙測與更新：設定頁可關閉「Telemetry Enabled」與「Update Check Enabled」，並可「Export Telemetry」匯出本機匿名紀錄（5MB 環迴、無外傳，預設寫入 `rootPath/telemetry.log`）。「手動檢查更新」會呼叫安全端點（環境變數 `UPDATE_CHECK_ENDPOINT`，預設 https），停用更新檢查時會略過呼叫。如無需遙測/更新檢查可直接停用。  
4) 啟動開發伺服：`npm run dev` → http://localhost:3000。  
5) 首次載入確認 RootPathAlert 無錯誤；若路徑失效，依提示重新定位。

## 核心操作
- **收件匣捕捉**：在收件匣輸入草稿，系統 2 秒自動儲存（無輸入暫停）；列表可預覽/排序。  
- **草稿轉正**：於草稿頁點「轉正」，填標題/專案/標籤/狀態/模型 → 生成 Markdown 檔並移除草稿。  
- **提示詞編輯**：左欄列表依專案/狀態/搜尋篩選，點擊後右側 Markdown 編輯，提供完整/精簡複製、專注模式、Pin（預設 ON）。  
- **片語插入**：按 Alt+S 或按鈕開啟右側 Drawer，搜尋/點擊片語即插入游標並累計使用次數。  
- **危險操作**：刪除/移動/歸檔需二段式確認並提供 5–10 秒 Undo。

## 快捷鍵
- Alt+L 列表顯示/隱藏  
- Alt+P Pin 切換  
- Alt+N 新增提示詞  
- Alt+Shift+N 快速草稿  
- Alt+S 片語 Drawer  
- Ctrl+K 全域搜尋  
- Ctrl+Shift+C 精簡複製

## 偏好與儲存
- Pin/寬度/字級等偏好儲存在 localStorage 單一 key（節流寫入），載入失敗回退預設。  
- 檔案與 LowDB 寫入由 API 層序列化處理，衝突會以對話框提示「載入外部 / 保留目前 / 檢視差異」。  
- 資料存放於使用者目錄隱藏資料夾，沿用 OS 權限，預設無應用層加密；必要時可手動加密目錄或放置在加密磁碟區。

## 遙測與診斷
- 預設啟用本機匿名紀錄（不外傳），容量 5MB 環迴；可在設定停用或匯出診斷檔（Export Telemetry）。  
- 記錄 CRUD、衝突對話框選擇、搜尋/插入耗時（僅本機檔案）；匯出檔案大小應 ≤5MB。

## 測試
- 全部測試：`npm run test`  
- 契約測試：`npm run test -- tests/contract`  
- 整合測試：`npm run test -- tests/integration`  
- 覆蓋率需 ≥80%，關鍵路徑力求 100%。
