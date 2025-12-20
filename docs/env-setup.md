# 環境設定說明

## 系統需求
- Node.js 18+（含 npm）
- 可寫入專案目錄的檔案系統權限

## 主要環境變數
- `DB_FILE`: LowDB 路徑，預設 `<repo>/db.json`。如部署到容器，建議掛載 volume 保存。
- `DEFAULT_ROOT`: 提示詞檔案根目錄，預設 `<repo>/Prompts`。需確保可讀寫。

## 安裝步驟（首次）
```bash
npm install
```

## 檔案與資料夾
- `db.json`: LowDB 資料庫（專案/收件匣/片語/設定）。
- `Prompts/`: 存放 Markdown 提示詞，結構 `Prompts/{ProjectName}/{SafeTitle}.md`。

## 其他注意事項
- 遙測與更新檢查預設開啟，可在 UI Settings 關閉。
- 如使用 CI/CD，確保 workflow 環境具備 Node 18 並執行 `npm run lint && npm run typecheck && npm run test`。
