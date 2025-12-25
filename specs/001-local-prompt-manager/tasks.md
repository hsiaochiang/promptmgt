# Tasks: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

**Input**: specs/001-local-prompt-manager/
**Prerequisites**: plan.md、spec.md（User Stories）、research.md、data-model.md、contracts/

## Phase 1: Setup

**Purpose**: 專案啟動與環境基線

- [X] T001 確認與安裝開發依賴（Node 18、Next.js/Tailwind/Vitest）於 package.json
- [X] T002 建立預設本機根路徑設定說明與範例於 docs/startup-guide.md（含 `%USERPROFILE%/.promptmgt`）
- [X] T003 [P] 校驗專案 lint/test 腳本可執行並記錄於 docs/env-setup.md

---

## Phase 2: Foundational

**Purpose**: 所有使用者故事依賴的底層能力（完成前不得開始故事）

- [X] T004 建立共用 zod schema（Project/Prompt/Inbox/Snippet/Settings）於 lib/types/schema.ts，覆蓋 data-model 欄位與驗證規則
- [X] T005 實作檔案與 LowDB 存取抽象（序列化佇列 + mtime/hash 驗證）於 lib/db.ts 與 lib/db/fs/prompts.ts
- [X] T006 實作檔名清理與 Frontmatter 處理流程於 lib/utils/sanitizeFilename.ts、lib/utils/frontmatter.ts，對應 Edge Case 禁用字元與降級模式
- [X] T007 建立衝突偵測/決策服務於 lib/services/conflict.ts（載入外部/保留目前/檢視差異 事件介面）
- [X] T008 實作本機觀測性（5MB 環迴、可匯出、可停用）於 lib/services/telemetry.ts，並在 docs/settings/telemetry.md 補充使用方式
- [X] T009 [P] 建立 localStorage 偏好封裝（Pin/寬度/字級）於 app/(workspace)/store/useWorkspaceStore.ts，含 schema 驗證與 fallback
- [X] T010 [P] 更新錯誤格式與處理管線（{code,message,details}）於 app/api/_middleware 或共用 handler util，並覆蓋所有 Route Handlers 使用

--

## 時間與專案說明需求（新增）

**目的**: 落實 FR-033/FR-034（每個專案需有專案說明 Markdown 檔；所有時間以 ISO8601 UTC+08:00 儲存，UI 顯示 MM/DD HH:mm，編輯器標題列顯示 HH:mm）。

- [X] T064 已完成：新增日期工具 `lib/utils/date.ts`（toIsoWithOffset、formatForUI_MMDD_HHmm、formatForUI_HHmm）
- [X] T065 已完成：更新 `lib/utils/frontmatter.ts` 以使用 `toIsoWithOffset()` 作為 `updatedAt` 的預設值（序列化為 ISO+08:00）
- [X] T066 [US3] [P] 在列表與詳情 UI 使用 `formatForUI_MMDD_HHmm()` 以顯示時間於 `app/(workspace)/components/prompt-list.tsx`、`app/(workspace)/components/project-list.tsx`、`app/(workspace)/components/prompt-header.tsx`
- [X] T067 [US3] 在編輯器標題列使用 `formatForUI_HHmm()` 只顯示 `HH:mm`（檔案: `app/(workspace)/components/prompt-header.tsx`）
- [X] T068 [US2] 更新 `lib/types/schema.ts`：為 `project` schema 新增 `docPath` 欄位，並更新 zod 驗證（路徑為 `lib/types/schema.ts`）
- [X] T069 [US2] 實作 Project README CRUD Route Handlers：`app/api/projects/[id]/readme/route.ts`（GET/PUT），並在 `lib/db/fs/projects.ts` 或 `lib/services` 中加入對應的檔案讀寫支援
- [X] T070 [US2] 前端：在專案檢視頁加入專案說明編輯/儲存元件 `app/(workspace)/components/project-readme.tsx`，並於專案建立時自動建立 README.md（範例路徑 `Prompts/{ProjectName}/README.md`）
- [X] T071 [P] 單元測試：新增 `tests/unit/date.test.ts` 測試 `toIsoWithOffset()` 與格式化函式（覆蓋時區邊界與合法格式）
- [X] T072 [P] 整合測試：新增 `tests/integration/frontmatter-timezone.test.ts` 驗證序列化後檔案 Frontmatter 中 `updatedAt/createdAt` 為 ISO+08:00 格式
- [X] T073 [P] 文件更新：將時間格式驗證步驟新增至 `docs/perf-checks.md` 與 `docs/ux-checks.md`（檔案: docs/perf-checks.md, docs/ux-checks.md）
- [X] T074 [P] 專案 README API/檔案整合測試：涵蓋 GET/PUT、檔案生成與錯誤處理，驗證 docPath 與 ISO+08:00 時間更新（tests/integration/project-readme.test.ts）
- [X] T075 [US2] 專案 README 編輯 UI 驗收：載入/編輯/保存/錯誤提示整合測試（建議 tests/integration/project-readme-ui.test.tsx），確保與 docPath 一致
- [X] T076 [P] 專案 README 操作文件：於 quickstart.md/README.md 補充 README 路徑、建立流程、常見錯誤與修復指引

## 根路徑設定（FR-022）

- [ ] T091 [P][FR-022] 後端：rootPath GET/PUT API（LowDB + localStorage 同步），驗證不得為空且必須位於使用者目錄；錯誤碼覆蓋無效路徑/權限不足/非使用者目錄。
- [ ] T092 [FR-022] 前端：設定頁 rootPath 表單與錯誤提示，RootPathAlert 導回設定頁並顯示當前狀態；保存成功後刷新 projects/prompts/inbox 資料。
- [ ] T093 [P][FR-022] 測試：契約測試 rootPath GET/PUT、整合測試（設定→重載→RootPathAlert 消失且路徑生效）、單元測試驗證預設值/錯誤訊息。
- [ ] T094 [P][FR-022] 文件：quickstart.md/README.md 補充 rootPath 配置、使用者目錄限制、常見錯誤排查與重試步驟。

## 時間欄位完整性（FR-035）

- [ ] T095 [P][FR-035] 資料層：對 Project/Prompt/Inbox/Snippet/Settings 的建立與更新自動補齊 createdAt/updatedAt（ISO 8601, UTC+08:00），輸入缺值時由系統填補。
- [ ] T096 [FR-035] Schema：lib/types/schema.ts 強制所有實體包含 createdAt/updatedAt 並驗證格式；更新對應 zod schema 測試。
- [ ] T097 [P][FR-035] 契約/整合測試：抽樣每實體建立/更新 API 回應必帶 createdAt/updatedAt，並覆蓋檔案/LowDB 寫入時間格式。
- [ ] T098 [FR-035] UI：列表/詳情/標題列使用 formatter 顯示時間；缺值時不得渲染空白，需依補值後顯示；驗證 HH:mm / "MM/DD HH:mm" 規則。
- [ ] T099 [P][FR-035] 文件：在 docs/perf-checks.md / docs/ux-checks.md 增列時間欄位檢核流程與抽樣結果；標記 ISO+08:00 儲存、UI 格式要求。
- [ ] T100 [P][FR-035] 覆蓋率/回歸：新增或調整測試以滿足 ≥80% 覆蓋並納入回歸清單（createdAt/updatedAt 自動補值與顯示）。
---

## 衝突處理、Frontmatter 修復與本機日誌（新增）

- [X] T080 [US2] 檔案變更事件管線：`lib/services/conflict.ts` 增加檔案 watcher/mtime 檢查結果事件，5 秒內觸發通知
- [X] T081 [US2] UI 衝突提示：`app/(workspace)/components/prompt-editor.tsx`（或共用 modal）實作「載入外部/保留目前/檢視差異」對話框與狀態流，並寫入 Telemetry
- [X] T082 [P][US2] 整合測試：`tests/integration/conflict-dialog.test.tsx` 模擬外部修改→5 秒內出現對話框→三選行為驗證（含 mtime 衝突 409）
- [X] T083 [US3] Frontmatter 損壞降級：`lib/utils/frontmatter.ts` 增加 YAML 損壞時的降級路徑（純文字顯示、標記需修復），統一錯誤碼/訊息
- [X] T084 [US3] UI 顯示與修復：`app/(workspace)/components/prompt-editor.tsx` 顯示「需修復」橫幅並提供一鍵重新保存為有效 Frontmatter
- [X] T085 [P][US3] 測試：`tests/unit/frontmatter-fallback.test.ts` + `tests/integration/frontmatter-repair.test.tsx` 覆蓋損壞 YAML → 降級顯示 → 修復保存成功
- [X] T086 [P][NFR] Settings API/UI 支援 `logPath`：`app/api/settings/route.ts`、`app/(workspace)/settings/page.tsx` 讀寫 `logPath`，預設 `rootPath/logs/app.log`，限制不可指向非使用者目錄
- [X] T087 [P][NFR] 日誌遮蔽與旋轉測試：`lib/services/telemetry.ts` 實作敏感欄位遮蔽與 5MB 旋轉檢查；`tests/unit/telemetry-rotation.test.ts` 驗證
- [X] T088 [P][NFR] 文件同步：更新 `quickstart.md`/`README.md` 說明 `logPath`、遮蔽/旋轉特性與設定開關；列出相關環境變數（若有）
- [X] T089 [P][Edge] 契約示例與文案：`contracts/openapi.yaml` 增加搜尋截斷/分頁範例回應；`docs/ux-checks.md` 補充 UI 提示/空態文案準則
- [X] T090 [P][Edge] UI 空態/提示驗收：`tests/integration/search-truncate-ui.test.tsx` 覆蓋截斷提示、收件匣分頁空態與整理提示文案


---

## Phase 3: User Story 1 - 收件匣快速草稿捕捉 (Priority: P1) 🎯 MVP

**Goal**: 允許在收件匣快速輸入 Markdown 草稿並自動儲存，關閉重開可復原。

**Independent Test**: 僅收件匣與自動儲存；流程「開啟 → 輸入 → 關閉 → 重開」內容完整。

### Tests
- [X] T011 [P] [US1] 契約測試 /api/inbox (列表/新增/更新/刪除) 於 tests/contract/api-inbox.test.ts
- [X] T012 [P] [US1] 整合測試自動儲存與復原流程於 tests/integration/us1-draft-autosave.test.ts
- [X] T013 [P] [US1] 元件/Hook 單元測試（useAutosaveDraft、draft-editor）於 tests/unit/draft-editor-loading.test.tsx

### Implementation
- [X] T014 [P] [US1] 實作收件匣資料層（列表/新增/更新/刪除）於 lib/db/fs/prompts.ts 與 lib/services/cache.ts（草稿部分）
- [X] T015 [P] [US1] 實作 Route Handlers /app/api/inbox/route.ts 與 /app/api/inbox/[id]/route.ts（含 debounce 2 秒與 mtime 衝突 409）
- [X] T016 [US1] 更新前端收件匣列表與編輯器（app/(workspace)/components/inbox-list.tsx、draft-editor.tsx）支援 autosave/loading 指示
- [X] T017 [US1] 提供刪除草稿操作與即時計數更新於 app/(workspace)/actions/archiveDraft.ts

**Checkpoint**: US1 可獨立驗證捕捉/自動儲存/復原。

---

## Phase 4: User Story 2 - 專案歸檔與列表總覽 (Priority: P1)

**Goal**: 草稿轉正為正式提示詞，維護專案列表與計數，處理外部路徑失效。

**Independent Test**: 「草稿轉正 → 專案列表更新 → 檔案生成」可獨立運作。

### Tests
- [X] T018 [P] [US2] 契約測試 /api/projects 與 /api/prompts（新增/更新/刪除/轉正）於 tests/contract/api-projects-prompts.test.ts
- [X] T019 [P] [US2] 整合測試草稿轉正與專案計數更新於 tests/integration/us2-archive-draft.test.ts
- [X] T020 [P] [US2] 單元測試檔名清理與 Frontmatter 生成於 tests/unit/adapters-utils.test.ts

### Implementation
- [X] T021 [P] [US2] 實作 Project 管理 API 於 app/api/projects/route.ts（列表/新增）與 app/api/projects/[id]/route.ts（更新/刪除）
- [X] T022 [P] [US2] 實作 Prompt CRUD/轉正 API 於 app/api/prompts/route.ts 與 app/api/prompts/[id]/route.ts（含路徑失效與重定位提示）
- [X] T023 [US2] 更新 lib/services/search.ts 與 lib/services/cache.ts 以支援專案/狀態篩選與計數刷新
- [X] T024 [US2] 更新前端專案列表與提示詞列表（app/(workspace)/components/project-list.tsx、prompt-list.tsx、prompt-header.tsx）含轉正表單與重複名稱提示
- [X] T025 [US2] 處理外部移動/刪除路徑提示於 app/(workspace)/components/root-path-alert.tsx 與 settings/page.tsx（重新定位/移除）

**Checkpoint**: US1+US2 可獨立運行，專案計數與檔案寫入一致。

---

## Phase 5: User Story 3 - Markdown 編輯與精準複製 (Priority: P1)

**Goal**: 提供 Markdown 編輯/預覽與完整/精簡複製，支持專注模式與前言 accordion。

**Independent Test**: 「開啟提示詞 → 編輯 → 預覽 → 精簡複製」可單獨驗證。

### Tests
- [X] T026 [P] [US3] 契約測試 /api/prompts/{id} 更新/讀取含 Frontmatter 於 tests/contract/api-prompts-detail.test.ts
- [X] T027 [P] [US3] 整合測試精簡/完整複製與專注模式於 tests/integration/us3-copy-focus.test.tsx
- [X] T028 [P] [US3] 單元測試 clipboard/frontmatter utilities 於 tests/unit/clipboard.test.ts

### Implementation
- [X] T029 [P] [US3] 增強 lib/utils/clipboard.ts 與 lib/utils/frontmatter.ts 支援精簡/完整複製與錯誤處理
- [X] T030 [US3] 更新 app/(workspace)/components/prompt-editor.tsx 與 prompt-header.tsx，加入專注模式、前言 accordion 預設收合、儲存狀態顯示
- [X] T031 [US3] 確保自動儲存與快捷鍵（Ctrl+Shift+C 精簡複製）在 app/(workspace)/hooks/useAutosavePrompt.ts 與 useSnippetInsert.ts 正常運作

**Checkpoint**: US1-3 可獨立驗證，複製/專注/accordion 體驗完成。

---

## Phase 6: User Story 4 - 片語剪貼簿插入與統計 (Priority: P2)

**Goal**: 搜尋/插入片語至游標並記錄使用次數，Drawer 開關不重置編輯器。

**Independent Test**: 「新增片語 → 搜尋 → 插入 → 查看使用次數」可獨立驗證。

### Tests
- [X] T032 [P] [US4] 契約測試 /api/snippets (CRUD/搜尋/usage) 於 tests/contract/api-snippets.test.ts
- [X] T033 [P] [US4] 整合測試 Drawer 插入與 usageCount 更新於 tests/integration/us4-snippet-insert.test.tsx

### Implementation
- [X] T034 [P] [US4] 實作 Snippet API 於 app/api/snippets/route.ts 與 app/api/snippets/[id]/route.ts，插入時更新 usageCount/lastUsedAt
- [X] T035 [US4] 更新片語面板/Drawer 於 app/(workspace)/components/snippet-panel.tsx（Alt+S、overlay/Esc 關閉、保持游標）
- [X] T036 [US4] 更新 useSnippetInsert hook 與右側工具列觸發於 app/(workspace)/hooks/useSnippetInsert.ts、top-bar.tsx

**Checkpoint**: US4 完成片語搜尋/插入/統計且不影響編輯器狀態。

---

## Phase 7: User Story 5 - 佈局與操作效率 (Priority: P1)

**Goal**: 三欄拖曳持久化、Pin 切換/召回、快捷鍵與危險操作 Undo，字級 +2px 不裁切。

**Independent Test**: UI 交互即可驗證（無後端依賴）。

### Tests
- [X] T037 [P] [US5] UI 整合測試 Pin 收合/召回與拖曳寬度持久化於 tests/integration/us5-layout-pin.test.tsx
- [X] T038 [P] [US5] 單元測試快捷鍵映射與狀態持久化於 tests/unit/shortcuts.test.ts

### Implementation
- [X] T039 [P] [US5] 實作三欄寬度拖曳持久化（localStorage）於 app/(workspace)/components/workspace-shell.tsx，符合 150–250ms 收合 SLA
- [X] T040 [US5] 實作 Pin 切換預設 ON、OFF 後點選自動收合/Alt+L 召回於 app/(workspace)/components/prompt-list.tsx 與 store/useWorkspaceStore.ts
- [X] T041 [US5] 實作快捷鍵處理（Alt+L/P/N/Shift+N、Ctrl+K、Ctrl+Shift+C）於 app/(workspace)/components/top-bar.tsx 或全域 hotkey handler
- [X] T042 [US5] 危險操作二段式確認 + Undo snackbar（5–10 秒）於 app/(workspace)/components/prompt-list.tsx、project-list.tsx、snackbars
- [X] T043 [US5] 全站字級 +2px 與行高調整於 app/globals.css，確保不裁切並通過 docs/ux-checks.md 檢核

**Checkpoint**: US5 完成佈局/快捷鍵/Undo 體驗，可與其他故事並行驗證。

---

## Phase 7b: Gap Closure

- [X] T048 [P] 観測性落定：更新 plan 移除「NEEDS CLARIFICATION」，明確記載本機匿名遙測（5MB 環迴、可停用、可匯出、無外傳）；設定頁開關＋匯出指引（quickstart/README）。
- [X] T049 [P] 搜尋截斷契約/整合測試（FR-017）：/api/search 超過 1000 筆截斷為 1000 並回傳截斷旗標；前端顯示截斷提示；perf-checks 增列 p95 ≤2 秒檢查。
- [X] T050 [P] 頂部變更報告與快速新增（FR-018）：資料來源=本機提示詞/草稿近 24h 變更；欄位=時間/動作（新增|更新|刪除|轉正）/對象/標題/路徑；UI=頂部按鈕展開 Drawer/Modal，空態顯示「今日尚無變更」，點擊聚焦該提示詞/草稿；快速新增一鍵建立並聚焦編輯區；SLA 載入/展開 ≤1s、分頁 50 筆/頁；整合測試涵蓋空態、載入、點擊聚焦、快速新增成功/失敗，若有 API 則加契約測試。
- [X] T051 [P] 提示詞批次操作（FR-027）：限定單一專案範圍，提供全選/取消；危險動作需二段確認＋Undo 5–10 秒。動作：批次重新命名（同名套用、更新 updatedAt）、批次複製（標題「{原標題} 副本」，保留標籤/模型，更新 updatedAt）、批次移動（輸入目標專案，衝突提示更名/拒絕覆蓋）、批次歸檔（status=已封存）、批次刪除（可 Undo 全量，失敗個案彙總提示）。整合測試：多選＋刪除 Undo、移動到新專案、批次複製產 N 筆、歸檔狀態更新；如有批次 API 補契約測試。
- [X] T052 儲存路徑驗證（NFR-002）：啟動檢查/腳本確保資料存於使用者目錄隱藏資料夾，沿用 OS 權限、無應用層加密；quickstart 標示安全性假設；單元/腳本測試覆蓋預設路徑建立與權限。
- [X] T053 [P] 收件匣 100+ 分頁/搜尋（Edge Case）：草稿超過 100 筆時啟用分頁（預設 50/頁，可配置，與 spec 對齊），搜尋需跨頁；顯示整理提示文案。
- [X] T053a [P] 收件匣分頁/搜尋測試：整合測試驗證僅顯示第一頁、跨頁搜尋命中後頁、空態/提示文案；覆核分頁大小預設 50/頁與可配置行為。
- [X] T054 [P] 更新檢查開關基礎（NFR-001）：設定 schema/LowDB+localStorage 持久化，預設 ON，支援手動觸發與離線 noop；記錄端點/頻率策略。
- [X] T054a [P] 更新檢查 UI/Route：設定頁 toggle + 手動檢查按鈕，若有 API 則補契約測試；錯誤提示/重試行為。
- [X] T054b [P] 更新檢查測試與文件：單元/整合涵蓋 toggle/手動檢查/離線；quickstart/README 同步說明端點/頻率/離線策略。
- [X] T061 [P] 片語需求對齊（FR-010）：統一需求敘述/命名於 spec/plan/tasks；更新相關測試/文件引用避免重複。

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T044 [P] 更新 quickstart.md 與 README.md：同步根路徑設定、遙測/更新檢查開關、快捷鍵、片語 Drawer、收件匣分頁/搜尋行為，並標示環境變數 INBOX_PAGE_SIZE。
- [X] T045 [P] 效能回歸檢查與調優：依 docs/perf-checks.md 撰寫與執行啟動/搜尋/精簡複製/Pin 動畫 p95 量測，若未達 SC-001/SC-003/SC-004/SC-008/SC-011 提出調優方案。
- [X] T046 安全與復原檢查：覆核檔名禁用字元處理、路徑失效提醒、衝突對話框，並將結果填入 docs/ux-checks.md。
- [X] T047 [P] 覆蓋率稽核：執行 `vitest --coverage`，列出 <80% 或關鍵路徑 <100% 檔案/行號清單（coverage/lcov-report/index.html 佐證）。
- [X] T055 [P] 效能量測腳本：建立啟動/搜尋/精簡複製/Pin 動畫/autosave 節奏的量測腳本或可重現手動步驟，對應 SC-001/SC-003（驗收 ≤3 秒，內部目標 <150ms）/SC-004/SC-008/SC-011，並可重複回歸。
- [X] T056 [P] 效能實測與記錄：執行 T055 腳本，將數據與偏差填入 docs/perf-checks.md；未達標列調優方案、負責人與時程（包含 SC-003 驗收/內部目標差異說明）。
- [X] T057 [P] 回歸檢查掛鉤：將搜尋截斷、Pin 動畫、autosave 節流與快捷鍵成功率納入回歸（CI 或手動清單），描述執行頻率與觸發條件。
- [X] T058 [P] 覆蓋率掃描：生成 lcov 差距清單，標記關鍵路徑（conflict handling、root path init、search truncation、batch ops、undo/snackbar 等）。
- [X] T059 [P] 覆蓋率補測：補齊 T058 標記路徑的單元/整合測試並更新 lcov。
- [X] T060 [P] 覆蓋率流程文件：記錄覆蓋率檢查流程與閾值（≥80%，關鍵 100%），標明 CI/手動檢查步驟、失敗處理，並連結 coverage/lcov-report/index.html。
- [X] T062 [P] SC 驗證對應表：建立成功指標 SC-001~SC-020 與測試/量測任務對應表，存於 docs/perf-checks.md 或專章，確保每項 SC 具備驗證方法與頻率（SC-009 驗收 ≥80%，可標註內部更高目標；SC-016~SC-020 依 UX 檢核）。
- [X] T063 [P] SC 實測執行：依 T062 執行並記錄各 SC 的實測/測試結果（含數據、結論、改進方案），未達標需回填 T045/T056 調優計畫並同步 perf/ux 檢核文件。

---

## Dependencies & Execution Order
- Phase 1 → Phase 2 → User Stories（US1 → US2 → US3 → US5 → US4）→ Final Phase。
- User Stories 可在 Phase 2 完成後並行，但交付順序建議 US1 → US2 → US3 → US5 → US4（依優先級與依賴）。

## Parallel Execution Examples
- Foundational：T009 與 T010 可併行；T004~T006 可併行後由 T007/T008 彙整。
- US1：T011~T013 測試可併行；T014/T015 可併行後再進行 T016/T017。
- US2：T018/T019/T020 併行；T021/T022 併行後再做 T023/T024/T025。
- US3：T026/T027/T028 併行；T029 併行後再進行 T030/T031。
- US4：T032/T033 併行；T034 併行後再做 T035/T036。
- US5：T037/T038 併行；T039/T040/T041 併行，最後 T042/T043。
