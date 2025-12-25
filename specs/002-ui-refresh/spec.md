# 002 UI Refresh — 規格草稿

## 背景
- 在現有 Prompt Management App 中新增 `/ui-playground` 頁面，用於預覽新 UI 原型（來源：`0resource/ui_prototype_v2.tsx`）。
- 保留現有 `/` 主路徑與既有功能；此頁純預覽，不串接後端。

## 需求概要
- 新增 App Router 頁面：`/ui-playground`，以 Client Component 包裝原型。
- 原型需可在瀏覽器端運作（`localStorage`/`navigator.clipboard`），避免伺服端渲染問題。
- 不影響現有 `app/(workspace)` 動線與測試。

## 範圍外
- 未串接實際資料層（DB/檔案系統）。
- 未替換現有 Workspace UI；僅提供平行預覽。

## 驗收要點
- 造訪 `/ui-playground` 可顯示完整原型、可互動（新增/複製/刪除提示詞、Drawer/Modal 切換）。
- 不影響 `/` 既有頁面；CI 測試不新增失敗案例。
- 原型保有現有色彩提示與操作說明區塊。

## 技術筆記
- 使用 `"use client"` 於 `app/ui-playground/page.tsx` 與 `UiPrototype.tsx`，避免 SSR 遇到 `window`/`localStorage`。
- 保留 `// @ts-nocheck` 以快速引入原型（後續可分解型別）。
- 若未來整合現有狀態/資料層，需替換 `useLocalStorageState` 與 DEMO 資料來源。
