# 環境設定說明

## 系統需求
- Node.js 18+（含 npm）
- 可寫入專案目錄的檔案系統權限

## 主要環境變數
- `DB_FILE`: LowDB 路徑，預設 `<repo>/db.json`。如部署到容器，建議掛載 volume 保存。
- `DEFAULT_ROOT`: 提示詞檔案根目錄，預設 `<repo>/Prompts`，建議在設定頁或環境變數覆寫為 `%USERPROFILE%/.promptmgt`（或 `~/.promptmgt`）。需確保可讀寫。

## 安裝步驟（首次）
```bash
npm install
```

## 腳本驗證（2025-12-21）
- `npm run lint`：通過（next lint，無警告/錯誤）。
- `npm run test`：通過（vitest coverage，82 tests，coverage 約 97% / branch 80%）。

## 測試指令補充
- `npm run test`：含 coverage 與全域門檻（CI/合併前建議使用）。
- `npm run test:fast -- <test-file>`：不含 coverage 閘門（適合單檔快速迭代）。
- `npm run test:contract`：只跑契約測試（不含 coverage 閘門）。

## 其他注意事項
- 遙測與更新檢查預設開啟，可在 UI Settings 關閉。
- 如使用 CI/CD，確保 workflow 環境具備 Node 18 並執行 `npm run lint && npm run typecheck && npm run test`。
