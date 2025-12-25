# 002 UI Refresh — 執行計畫草稿

## 目標
- 提供 `/ui-playground` 頁面給設計/PM/開發共同驗收 UI 動線。
- 保持低風險：不改動既有 `/` 工作區，獨立路由。

## 工作分解
1) 路由與原型接線
- 新增 `app/ui-playground/page.tsx`（Client Component）。
- 搬移原型為 `app/ui-playground/UiPrototype.tsx`，保留 `@ts-nocheck` 以快速運行。

2) 相容性與測試
- 確認 Vitest 不覆蓋此頁；若需 E2E/可視化，另行新增。
- 需 mock `navigator.clipboard`/`localStorage` 時，可在測試設定加前置（目前未觸發）。

3) 漸進導入構想
- 短期：用 `/ui-playground` 作為設計審查與可用性測試場域。
- 中期：拆解原型為共用元件（列表、Drawer、Meta 編輯等），逐步替換 `/` 上的對應區塊。
- 回退機制：保留現行 `/`，任何替換以 feature flag（環境變數或設定檔）切換，確保可快速恢復。

## 風險/限制
- 原型使用 `localStorage` 持久化寬度/Pin 狀態，需在 SSR 禁用：已採 Client 路由。
- `navigator.clipboard` 在部分瀏覽器需 HTTPS；若失敗以 Snackbar 提示。

## 後續輸出
- 驗收紀錄：收集使用者回饋後，更新此計畫與規格。
- 拆解清單：待確認要優先移植的元件與狀態流（Pin、Drawer、Autosave 標示等）。
