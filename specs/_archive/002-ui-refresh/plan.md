# 002 UI Refresh — 執行計畫（Checkpoint 4）

> Status: Archived（歷史文件）
> 
> 本計畫為早期 UI refresh checkpoint；現行功能與文件請以 `specs/001-local-prompt-manager/` 為準。

## 1. 目標
- 在 Next.js 14 App Router 內完成新 IA 頁面（/dashboard、/projects、/projects/[id]、/prompts、/prompts/[id]、/scratchpad），以 mock data 驗證 UI/互動與狀態切換。
- 保持低風險：不動既有 `/` 工作區，所有新頁面集中於 `app/(app)`，可隨時回退。

## 2. How（實作指引）
### 2.1 路由與 Layout
- 入口：`app/(app)/layout.tsx` 包 `MockAppProvider` + `AppShell`。
- 路由：`/dashboard`、`/projects`、`/projects/[id]`、`/prompts`、`/prompts/[id]`、`/scratchpad` 均在 `app/(app)` 目錄。
- Dev 狀態切換：共用 `DevStateToggle` 控制 loading/empty/error/success，占位文案需與 spec 一致。

### 2.2 元件拆分
- 基礎：`AppShell`（導航）、`ToastHost`、`Dialog`、`DataTable`、`TagPicker`、`DevStateToggle`。
- 功能：`PromptEditor`、`PromptListPanel`、`ProgressLogList`。
- 資料：`MockAppProvider` 內含 projects/prompts/scratchpad/toasts action（create/update/archive/move/tag/copy/logs）。
- 共用邏輯：`lib/ui/promptFilters.ts`（搜尋/篩選），避免多處實作分歧。

### 2.3 Mock data 策略
- `MockAppProvider` 持有初始示例資料；所有頁面以 context 取得與 mutate。
- 互動（copy/save/archive/move）須在 mock 中反映結果並觸發 toast。
- clipboard 行為在測試中以 `navigator.clipboard.writeText` mock，避免環境差異。

### 2.4 Vitest 策略
- 環境：`vitest.config.ts` 已設 jsdom + coverage 80% 門檻。
- 新增測試：
	- `tests/unit/new-ia.test.tsx`：progress log 狀態轉換、prompts 搜尋/空狀態、copy toast。
	- `tests/unit/prompt-filters.test.ts`：篩選邏輯。
- 覆蓋率：維持全域 80%（已通過）；新增測試不得降低覆蓋率。

### 2.5 回滾與風險緩解
- 回滾：新 IA 與現有 `/` 無耦合，可直接停止使用 /app/(app) 或 revert commit；不需關閉 feature flag。
- 若未來導入 `/`，需以 env/flag 控制，避免影響舊工作區。
- 風險：UI 腳本偏離 → 以 Given/When/Then 驗收；mock 與真實 schema 差異 → 後續對照 API schema；clipboard 環境差 → 測試中強制 mock。

## 3. 可操作驗證方式
- 開發伺服器：
	```bash
	npm run dev
	```
	預期：localhost:3000 可瀏覽新路由；DevStateToggle 可切換四態，互動遵循 spec。
- 單元/整合測試：
	```bash
	npm test
	```
	預期：全部通過；coverage >= 門檻（branches ≥80%）。
- 建置：
	```bash
	npm run build
	```
	預期：Next.js build 成功，無額外 lint/type 錯誤（ts 嚴格度沿用既有設定）。

## 4. 風險與緩解
- UI 偏離 spec：在 spec 列出的互動/狀態/文案需逐一對照，PR 自檢必跑 npm test。
- Mock 與實際資料模型不符：待串接時以 API schema 對照；必要時在 provider 加欄位註解。
- Clipboard/瀏覽器限制：行為以 toast 呈現結果；測試統一 mock，避免 CI 不同環境失敗。

## 5. 開發任務對照（供 /speckit.implement）
- 路由/頁面：照 2.1 建立，皆包在 `(app)` layout。
- 元件：照 2.2 拆分，避免在頁面內再手刻等價邏輯。
- 資料層：使用 `MockAppProvider`，不得直接在頁面內另建全域狀態。
- 測試：至少覆蓋 progress log 狀態流、prompts 搜尋/空狀態、copy toast；維持 coverage 門檻。

## 6. 任務完成定義
- 所有指定路由可運行、符合互動規則，Dev 狀態可切換並顯示對應占位。
- `npm test` 全綠，coverage 達成。
- spec 中的 Given/When/Then 可手動或自動化重現。

## 7. 後續 /speckit.implement 提示
- 請使用本計畫的路由/元件名稱，不新增未定義的 UI 模式。
- 任何與現有 `/` workspace 的整合另開 flag；本次輸出維持獨立。
