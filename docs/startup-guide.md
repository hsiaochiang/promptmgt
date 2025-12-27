# 啟動與日常操作

## 根路徑與資料位置
- 推薦根路徑：`%USERPROFILE%/.promptmgt`（Windows）或 `~/.promptmgt`（macOS/Linux）。
- 若未設定，程式會使用 `DEFAULT_ROOT`（可由環境變數或 UI Settings 設定頁設定），並在第一次啟動時建立資料夾與必要檔案。
- 所有本機資料（草稿/提示詞/設定）沿用作業系統使用者權限，預設不加密；如需更換路徑，請於設定頁更新後重新載入。

## 每次啟動
```bash
npm run dev
# 或生產建置後
npm run build
npm start
```
- 預設 http://localhost:3000
- 首次啟動會自動建立 `db.json` 與根路徑資料夾（含 `Prompts/`）。

## 啟動前檢查清單
- 環境變數：是否需要覆寫 `DB_FILE`、`DEFAULT_ROOT`。
- 檔案權限：`db.json` 與 `Prompts/` 目錄可讀寫。
- 依需求關閉遙測/更新：UI Settings 頁切換。

## 健康檢查
- `npm run lint`：語法/風格檢查
- `npm run typecheck`：型別檢查
- `npm run test`：單元/整合/契約測試（含 80% 覆蓋率閘門；CI/合併前必跑）
- `npm run test:fast -- <test-file>`：本機快速驗證（不含 coverage 閘門，適合單檔迭代）

## 常見操作
- 變更根路徑：進入 Settings → 更新 Root Path（建議指向 `~/.promptmgt`）。
- 建立草稿：TopBar「新增提示詞」→ 收件匣出現草稿。
- 草稿轉正：使用 archiveDraft（UI 操作）將草稿寫入 `Prompts/` 並更新專案計數。
- 片語插入：SnippetPanel 點擊 → 插入編輯器並使 usage +1。

## 部署提示
- 生產模式請使用 `npm run build && npm start`。
- 若跑在容器，掛載 volume 保存 `db.json` 與 `Prompts/`。
- CI 已有 workflow（.github/workflows/ci.yml）跑 lint/typecheck/test，可沿用。
