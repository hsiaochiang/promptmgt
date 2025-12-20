# 遙測與更新檢查白名單

目的：紀錄允許的遙測/更新檢查欄位與行為，避免傳送提示詞內容或檔名。預設開啟，可於設定關閉。

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

## 傳送頻率
- 遙測：啟動時至多一次；長時執行期間每 6 小時一次心跳（無內容量測）。
- 更新檢查：啟動時檢查一次；之後每 24 小時一次；失敗時退避到 48 小時。

## 停用行為
- 當 `telemetryEnabled=false`：跳過所有遙測請求，不佇列、不重試。
- 當 `updateCheckEnabled=false`：跳過所有更新檢查，不下載、不提示。
- 設定變更立即生效，寫入 LowDB `settings`。

## 其他防護
- 傳輸前執行紅線檢查：若 payload 含路徑/檔名/內容欄位，整筆棄送並記錄本地錯誤碼。
- 失敗不重送敏感資料；僅記錄計數型錯誤碼。
- 僅允許 HTTPS 端點（未來實作時強制）。
