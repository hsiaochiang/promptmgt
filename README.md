# 本機提示詞管理系統

簡介：Next.js 14 App Router + LowDB + 檔案系統的雙層儲存提示詞管理工具，UI 依附帶的 prototype 拆分。支援收件匣草稿、專案提示詞列表、Markdown 編輯、自動儲存、片語插入、遙測／更新檢查開關。

## 環境需求
- Node.js 18+
- npm / pnpm / yarn 其一（範例以 npm）

## 安裝與啟動
```bash
npm install
npm run dev
```
- 預設使用 `http://localhost:3000`
- 首次啟動會在專案根目錄生成 `db.json`（LowDB）；提示詞根路徑預設為使用者目錄的隱藏資料夾 `.promptmgt`，啟動時自動建立

## 常用指令
- 開發伺服器：`npm run dev`
- Lint：`npm run lint`
- 型別檢查：`npm run typecheck`
- 格式化：`npm run format`
- 單元/整合/契約測試含覆蓋率（CI/合併前必跑）：`npm run test`
- 快速跑測試（不含覆蓋率閘門，適合單檔迭代）：`npm run test:fast -- tests/contract/api-project-readme.test.ts`
- 跑契約測試（不含覆蓋率閘門）：`npm run test:contract`
- Watch 模式（不含覆蓋率閘門）：`npm run test:watch`
- E2E（Playwright）：`npm run e2e -- tests/e2e/us1-smoke.spec.ts`
- 安裝 Playwright 瀏覽器（首次或 CI 本機排查用）：`npm run e2e:install`
- 生產建置：`npm run build`（之後可 `npm start`）

## 規格與計畫（單一真相來源）
- 現行規格：`specs/001-local-prompt-manager/spec.md`
- 現行計畫：`specs/001-local-prompt-manager/plan.md`
- 歷史規格/計畫：`specs/_archive/`（避免與現行版本混淆）

## 設定與資料位置
- 環境變數
  - `DB_FILE`: LowDB 檔案路徑，預設 `<repo>/db.json`
  - `DEFAULT_ROOT`: 提示詞檔案根目錄，預設 `%USERPROFILE%/.promptmgt` 或 `~/.promptmgt`（啟動時自動建立）
  - `INBOX_PAGE_SIZE`: 收件匣分頁大小，預設 50，搜尋會跨頁
- 進入 Workspace 後可於 Settings 頁切換
  - 根路徑（Root Path）：缺路徑會出現 RootPathAlert 導引設定；失效時可重新定位或建立預設資料夾
  - 日誌路徑（Log Path）：預設 `rootPath/logs/app.log`，允許位於使用者目錄或 `rootPath` 之下；結構化 JSON、遮蔽敏感資訊、5MB 自動旋轉。
  - 遙測（Telemetry Enabled）：本機匿名紀錄，5MB 環迴、無外傳，可隨時停用
  - 遙測匯出（Export Telemetry）：於設定頁匯出診斷檔，預設寫入 `logPath`（或 `telemetry.exportPath` 覆寫），檔案大小應 ≤5MB
  - 更新檢查（Update Check Enabled）：預設開啟，可停用避免對外連線；可於設定頁「手動檢查更新」呼叫安全端點（`UPDATE_CHECK_ENDPOINT`）。
- 提示詞儲存在 `DEFAULT_ROOT/{ProjectName}/{SafeTitle}.md`，含 YAML frontmatter（title/project/type/status/model/tags/updatedAt/notes）；資料沿用 OS 權限，預設無應用層加密。
- 提示詞儲存在 `DEFAULT_ROOT/{ProjectName}/{SafeTitle}.md`，含 YAML frontmatter（title/project/type/status/model/tags/updatedAt/note；歷史相容 `notes`）；資料沿用 OS 權限，預設無應用層加密。
- 專案 README：建立專案時會自動生成 `rootPath/Prompts/{專案名稱}/README.md`（名稱經 `sanitizeFilename` 處理）；儲存會帶 `expectedHash/expectedMtime`，若收到 409 代表檔案已被外部修改，請重新載入後合併。

## API 概覽（App Router route handlers）
- Projects
  - `GET /api/projects`：回傳專案清單（套用提示詞快取計數與 updatedAt）
  - `POST /api/projects`：新增專案（body: name, status?）
  - `PATCH /api/projects`：更新專案欄位（id 必填，status/name/promptCount 選填）
- Inbox
  - `GET /api/inbox`：列出草稿
  - `POST /api/inbox`：新增草稿
  - `PATCH /api/inbox`：更新草稿（含自動保存時間）
  - `DELETE /api/inbox`：刪除草稿
- Prompts
  - `GET /api/prompts?projectId=`：掃描檔案系統並解析 frontmatter，回傳列表（type/status/model/tags/updatedAt/projectId）
  - `GET /api/prompts/[id]`：讀取指定提示詞（frontmatter + body）
  - `POST /api/prompts/[id]`：寫入提示詞（含衝突偵測欄位）
- Snippets
  - `GET /api/snippets`：列出片語
  - `POST /api/snippets`：新增片語
  - `PATCH /api/snippets`：更新片語
  - `POST /api/snippets/[id]/usage`：點擊插入時 usage +1
- Settings
  - `GET /api/settings`：讀取設定（rootPath/telemetryEnabled/updateCheckEnabled）
  - `POST /api/settings`：更新設定
- Search
  - `POST /api/search`：全文搜尋（上限 1000 筆，返回 highlight 偏移）

## 測試
- 使用 Vitest（jsdom）涵蓋契約、單元、整合測試，覆蓋率門檻 80%（臨界路徑更高）。
- 合併前/CI：`npm run test`（含 coverage，會套用全域 coverage threshold）
- 本機快速驗證：`npm run test:fast -- <test-file>`（不含 coverage threshold）

### 何時用哪個指令

- `npm run test`：CI/合併前必跑（含 coverage gate）。
- `npm run test:contract`：只跑 API 契約測試（不含 coverage gate），適合本機快速驗證 API 變更。
- `npm run test:fast -- <test-file>`：單檔迭代（不含 coverage gate）。
- `npm run e2e -- tests/e2e/us1-smoke.spec.ts`：最小 E2E smoke（啟動 app → Tabs 切換 → RootPathAlert 不阻擋）。

## 開發提示
- 檔名經 `sanitizeFilename` 處理避免非法字元。
- 提示詞列表排序：依 `updatedAt` 由新到舊；快取計數於掃描後寫回。
- 遙測/更新檢查預設開啟，可在設定頁停用；遙測 payload 不含提示內容與檔名全文。
- 收件匣 50+/分頁時持續顯示整理提示，搜尋跨頁；可用 `INBOX_PAGE_SIZE` 快速調整驗證分頁效能。
- 片語 Drawer（Alt+S）不會重置編輯內容，插入會更新使用次數並回饋 toast/標籤。
