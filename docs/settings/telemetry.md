# 遙測與更新檢查白名單

目的：紀錄允許的遙測/更新檢查欄位與行為，避免傳送提示詞內容或檔名。**遙測僅存於本機 5MB 環迴緩衝，可匯出，不對外傳送**，預設開啟，可於設定關閉。

## Payload 白名單（允許）
- `event`: 事件名稱（如 `app_start`, `search_perf`, `update_check`）
- `timestamp`: ISO 時戳
- `appVersion`: 應用版本/commit（無檔名、無內容）
- `platform`: OS/arch（例：`windows-x64`）
- `settings`: `{ telemetryEnabled, updateCheckEnabled }`
- `counts`: `{ projects, prompts, inbox, snippets }` 只含數量
- `performance`: `{ searchLatencyMs?, pasteSizeKb?, autosaveMs? }`（僅數值）
- `errors`: 錯誤代碼/類型（不含路徑與檔名）
- `update`: `{ currentVersion, latestVersion, status }`

## 嚴禁傳送（拒絕）
- 提示詞本文、Frontmatter 全部欄位（title/project/tags/model/status/notes 等）
- 檔名、路徑、rootPath、snippet 內容
- 使用者輸入的全文/片語/剪貼簿
- 搜尋查詢字串與 paste 原文

## 寫入與匯出
- 緩衝：在記憶體維持 5MB 環迴，超過時移除最舊事件。
- 匯出路徑：
	- 若 `settings.telemetry.exportPath` 存在則寫入該檔案。
	- 否則使用 `settings.rootPath/telemetry.log`。
- 格式：以換行分隔的 JSON，每行一筆事件，可供問題回報時匯出。
- 呼叫 `exportTelemetry()` 時立即落盤，僅包含已緩衝的事件。

## 傳送頻率
- 遙測：事件由應用觸發（CRUD、衝突對話框選擇、搜尋耗時等），只寫入本機緩衝。
- 更新檢查：啟動時檢查一次；之後每 24 小時一次；失敗時退避到 48 小時。

## 停用行為
- 當 `telemetryEnabled=false` 或 `telemetry.enabled=false`：跳過所有遙測紀錄與匯出，不佇列、不重試。
- 當 `updateCheckEnabled=false`：跳過所有更新檢查，不下載、不提示。
- 設定變更立即生效，寫入 LowDB `settings`。

## 其他防護
- 寫入前執行紅線檢查：若 payload 含路徑/檔名/內容欄位，整筆棄送。
- 緩衝只存計數/效能碼，不含提示詞內容或檔名。
- 更新檢查仍強制 HTTPS 端點。
