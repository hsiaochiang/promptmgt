# Quickstart（Phase 1）

## 環境
- Node.js 18+
- 安裝相依：`npm install`

## 開發啟動
- `npm run dev` → http://localhost:3000
- 首次啟動會建立 `db.json` 與 `Prompts/` 目錄（可用 `DB_FILE`、`DEFAULT_ROOT` 覆蓋）。

## 核心操作
- 收件匣：點「新增提示詞」或「新增草稿」→ 右側編輯（自動儲存間隔 2 秒，無輸入暫停）。
- 專案：在側邊專案列表新增並選取；提示詞列表將依選取專案載入。
- 草稿轉正：在草稿編輯區點「歸檔」，填標題/標籤/狀態/專案→ 生成 Markdown 檔並移除草稿。
- 編輯提示詞：列表選取→ 右側 Markdown 編輯，支援完整/精簡複製。
- 片語：在片語面板搜尋並點擊插入，會記錄使用次數。

## 測試
- 全部測試：`npm run test`
- 合約測試：`npm run test -- tests/contract`
- 整合測試：`npm run test -- tests/integration`
- 覆蓋率需 ≥80%，關鍵路徑 100%。
