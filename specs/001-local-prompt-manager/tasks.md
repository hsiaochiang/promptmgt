
---

# Tasks: 原型對齊提示詞工作台（001-local-prompt-manager）

**Input**: `specs/001-local-prompt-manager/`（plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md）
**Tech**: TypeScript / Next.js 14 App Router / React 18 / Tailwind / Zod / LowDB / CodeMirror

> 測試為「必做」：依 `spec.md` / `plan.md` 與專案 Constitution，採 test-first（先寫測試且先失敗，再實作使其通過）。

## Checklist Format（REQUIRED）

`- [ ] T001 [P?] [US?] 描述（含檔案路徑）`

---

## Phase 1: Setup（Shared Infrastructure）

**Purpose**: 確立工作分支與開發基線（不做 story 開發）

- [X] T001 確認本 feature 文件齊備且互相一致：specs/001-local-prompt-manager/{plan.md,spec.md,research.md,data-model.md,quickstart.md}
- [X] T002 確認本 repo 的 dev/build/test 腳本可用並記錄到文件：package.json
- [X] T003 [P] 確認 API 錯誤格式文件與實作一致（{code,message,details?}）：specs/001-local-prompt-manager/contracts/api.md
- [X] T004 [P] 確認 OpenAPI 與 Route Handlers 一致（method/path/409 details）：specs/001-local-prompt-manager/contracts/openapi.yaml

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: 所有 User Story 共用且會阻塞實作的基礎元件/依賴

- [X] T005 [P] 安裝 Markdown 預覽相依並更新 lockfile：package.json
- [X] T006 [P] 新增可重用的 Markdown 預覽元件（含基本樣式與 XSS 防護策略）：app/(workspace)/components/markdown-preview.tsx
- [X] T007 [P] 新增可重用的「編輯/預覽」Tabs 元件（供 Prompt Detail 使用）：app/(workspace)/components/editor-tabs.tsx
- [X] T008 [P] 新增可重用的 Snackbar Undo 元件（5 秒倒數、可注入 undo callback）：app/(workspace)/components/snackbar-undo.tsx
- [X] T009 [P] 擴充 workspace 狀態以支援 activeTab 與 scratchpad 內容：app/(workspace)/store/useWorkspaceStore.ts
- [X] T010 將 RootPathAlert 視為全站提示（不阻擋瀏覽）並統一掛載位置：app/(workspace)/workspace-shell.tsx
- [X] T011 統一 409 衝突回應 details（含 currentHash/currentMtime）以供 UI 顯示：app/api/_lib/responses.ts

**Checkpoint**: Foundational 完成後，US1~US6 可並行開發。

---

## Phase 3: User Story 1 - Workspace Shell + Topbar Tabs（Priority: P1）🎯 MVP

**Goal**: 以 prototype 為準提供 Topbar Tabs（專案/提示詞/剪貼簿）與固定 Main/Side Shell，並保留全域回饋元件。

**Independent Test**: 切換三個 Tabs 時，Main/Side 內容正確切換；rootPath 缺失時仍可瀏覽頁面且顯示 RootPathAlert。

### Tests（必須先寫且先失敗）

- [X] T063 [P] [US1] E2E（最小 smoke）：啟動 app → Tabs 切換（Projects/Prompts/Scratchpad）→ RootPathAlert 不阻擋：tests/e2e/us1-smoke.spec.ts

- [X] T043 [P] [US1] 整合測試：Topbar Tabs 切換 + RootPathAlert 顯示不阻擋：tests/integration/us1-shell-tabs-rootpath.test.tsx
- [X] T044 [P] [US1] 契約測試：Settings rootPath 讀寫與基本錯誤格式（空字串等）：tests/contract/api-settings.test.ts
- [X] T064 [P] [US1] 契約測試：Settings rootPath 不可存取路徑回傳標準錯誤格式（400 + details）：tests/contract/api-settings.test.ts

- [X] T065 [P] [US1] a11y 整合測試：Topbar Tabs 支援鍵盤操作（左右鍵切換、Enter/Space 啟用、aria-selected 正確）：tests/integration/us1-shell-tabs-a11y.test.tsx
- [X] T066 [P] a11y 手動檢核：依 WCAG 2.1 AA 最小驗收逐項確認（Tabs/Modal/Snackbar/RootPathAlert/錯誤訊息）：docs/ux-checks.md

- [X] T012 [US1] 將 Topbar 改為 Tabs 導覽（Projects/Prompts/Scratchpad）並保留設定入口：app/(workspace)/components/top-bar.tsx
- [X] T013 [US1] 在 workspace shell 實作 tab routing/state（不依賴 URL 亦可）：app/(workspace)/workspace-shell.tsx
- [X] T014 [P] [US1] 建立三個 Tab 的 placeholder views（未完成空態也可切換）：app/(workspace)/components/tab-placeholders.tsx
- [X] T015 [US1] 將 placeholder views 接到 workspace shell 的 tab switch（Main/Side 都切換）：app/(workspace)/workspace-shell.tsx
- [X] T016 [US1] 於 Shell 內掛載 Snackbar Undo（供後續刪除故事共用）：app/(workspace)/workspace-shell.tsx

- [X] T045 [US1] Settings API：支援 rootPath 讀寫與驗證（不可存取需回標準錯誤）：app/api/settings/route.ts
- [X] T046 [US1] Settings UI：提供 rootPath 表單/儲存/錯誤提示，並確保 RootPathAlert 可導向：app/(workspace)/settings/page.tsx
- [X] T047 [US1] RootPathAlert 文案/導向一致化（不阻擋瀏覽）：app/(workspace)/components/root-path-alert.tsx

---

## Phase 4: User Story 2 - Projects + Project Detail + README（Priority: P1）

**Goal**: 提供專案列表與專案詳情（含 README 編輯/儲存），互動與回饋對齊 prototype。

**Independent Test**: 可建立/切換專案；在 Project Detail 編輯 README 並成功儲存；保存後時間/狀態更新可見。

### Tests（必須先寫且先失敗）

- [X] T048 [P] [US2] 契約測試：Project README GET/PUT（含 409 details 與錯誤格式）（新增或擴充測試檔）：tests/contract/
- [X] T049 [P] [US2] 整合測試：Project Detail README 編輯/儲存/錯誤提示：tests/integration/us2-project-readme.test.tsx

- [X] T017 [US2] 對齊 Projects 列表（卡片/篩選/點擊進入詳情）與 Side KPI：app/(workspace)/components/project-list.tsx
- [X] T018 [US2] 在 Project Detail 中整合 README 編輯器（載入/儲存/錯誤提示）：app/(workspace)/components/project-readme.tsx
- [X] T019 [US2] README 儲存成功後更新 UI 顯示（使用 updatedAt 或 mtimeMs 顯示最後更新時間）：app/(workspace)/components/project-readme.tsx

---

## Phase 5: User Story 3 - Prompts（提示詞列表）（Priority: P1）

**Goal**: 提示詞列表提供基本篩選/瀏覽並可進入 Prompt Detail。

**Independent Test**: 在 Prompts 頁可看到列表並點擊進入 Prompt Detail；選取項目後 Side KPI 正確顯示。

### Tests（必須先寫且先失敗）

- [X] T050 [P] [US3] 整合測試：Prompts 列表點擊進入 Prompt Detail（選取狀態/Side KPI）：tests/integration/us3-prompts-nav.test.tsx

- [X] T020 [US3] 對齊 Prompts 列表（篩選/搜尋/點擊進入詳情）與 Side KPI：app/(workspace)/components/prompt-list.tsx

---

## Phase 6: User Story 4 - Prompt Detail（編輯/預覽 + autosave + 複製 + 409 三選一）（Priority: P1）

**Goal**: Prompt Detail 依原型提供 Markdown 編輯/預覽 Tabs、2 秒 autosave、完整/精簡複製，並在 409 時提供「重新載入 / 另存副本 / 強制覆寫」。

**Independent Test**:
- 編輯提示詞內容，停止輸入 2 秒觸發 autosave，且無輸入期間不重複觸發。
- 切換到「預覽」可看到 Markdown 渲染結果。
- 精簡/完整複製可正確寫入剪貼簿。
- 模擬 409 後可三選一且行為正確。

### Tests（必須先寫且先失敗）

- [X] T051 [P] [US4] 契約測試：Prompt detail 讀寫（updatedAt/createdAt 規則、409 details）：tests/contract/api-prompts-detail.test.ts
- [X] T052 [P] [US4] 整合測試：Prompt Detail（編輯→2 秒 autosave→預覽切換→複製）：tests/integration/us4-prompt-detail-core.test.tsx
- [X] T053 [P] [US4] 整合測試：409 三選一（重新載入/另存副本/強制覆寫）：tests/integration/us4-conflict-three-way.test.tsx
- [X] T054 [P] [US4] 單元測試：frontmatter 最小欄位與補值策略（含 createdAt/updatedAt）：tests/unit/frontmatter.test.ts

- [X] T021 [US4] 在 Prompt Detail 改為「編輯/預覽」Tabs（互斥切換，Main 區塊）：app/(workspace)/components/prompt-editor.tsx
- [X] T022 [US4] 以 MarkdownPreview 顯示預覽內容（需支援基本 Markdown、code block、列表）：app/(workspace)/components/prompt-editor.tsx
- [X] T023 [US4] autosave 成功後由 server 回傳值更新 lastSavedAt（避免 client 自行產生時間）：app/(workspace)/hooks/useAutosavePrompt.ts
- [X] T024 [US4] 修正後端：每次成功寫入強制更新 frontmatter.updatedAt（server 主導），createdAt 僅首次建立：app/api/prompts/[id]/route.ts
- [X] T025 [US4] 確保 PromptHeader 的「精簡/完整複製」符合 spec 並回饋 Toast/Snackbar：app/(workspace)/components/prompt-header.tsx
- [X] T026 [US4] 調整衝突對話框文案與按鈕命名為三選一：app/(workspace)/components/conflict-dialog.tsx
- [X] T027 [US4] 在 PromptEditor 實作「另存副本」：以 POST /api/prompts 建立新提示詞（新 title），並切換選取到新 prompt：app/(workspace)/components/prompt-editor.tsx
- [X] T028 [US4] 讓 autosave 409 回傳包含 currentHash/currentMtime，UI 用於顯示與後續覆寫：app/api/prompts/[id]/route.ts
- [X] T029 [US4] README 儲存遇到 409 時提供三選一（重新載入 / 另存副本（下載 .md） / 強制覆寫）：app/(workspace)/components/project-readme.tsx
- [X] T030 [US4] README 409 details 回傳補齊 currentHash/currentMtime：app/api/projects/[id]/readme/route.ts
- [X] T031 [US4] 更新合約文件反映 409 details 與三選一：specs/001-local-prompt-manager/contracts/{api.md,openapi.yaml}

- [X] T055 [US4] Frontmatter：落實 FR-006 最小欄位要求（缺值補值或阻擋靜默寫入）：lib/utils/frontmatter.ts
- [X] T056 [US4] Schema：更新/補強 frontmatter 相關驗證（對應 FR-006）：lib/types/schema.ts
- [X] T057 [US4] Prompt 寫入路徑：避免產出缺欄位 frontmatter（createdAt/updatedAt 由資料層主導）：app/api/prompts/[id]/route.ts

---

## Phase 7: User Story 5 - Scratchpad（剪貼簿）（Priority: P1）

**Goal**: 提供剪貼簿的新增/編輯/複製/刪除（UI/UX 依原型），Side 顯示 KPI。

**Independent Test**: 在 Scratchpad 可新增/編輯/複製項目，Side KPI 更新正確。

### Tests（必須先寫且先失敗）

- [X] T058 [P] [US5] 整合測試：Scratchpad 新增/編輯/複製（KPI 更新）：tests/integration/us5-scratchpad.test.tsx

- [X] T032 [P] [US5] 建立 Scratchpad（剪貼簿）頁面元件（Main 編輯、Side KPI/動作）：app/(workspace)/components/scratchpad.tsx
- [X] T033 [US5] 將 Scratchpad 納入 workspace store（含匯出/另存為提示詞的資料結構）：app/(workspace)/store/useWorkspaceStore.ts

---

## Phase 8: User Story 6 - 刪除 + Undo（5 秒 deferred delete）（Priority: P1）

**Goal**: 專案/提示詞/剪貼簿刪除均採 Confirm → Snackbar Undo（5 秒）；逾時才呼叫永久刪除。

**Independent Test**: 任一刪除操作確認後 5 秒內可 Undo 並完全復原；超過 5 秒才實際刪除且刷新列表。

### Tests（必須先寫且先失敗）

- [X] T059 [P] [US6] 整合測試：Project/Prompt/Scratchpad deferred delete + Undo 5 秒：tests/integration/us6-deferred-delete-undo.test.tsx

- [X] T034 [US6] 確保 Confirm Modal 元件可重用且文案對齊原型（取消/刪除）：app/(workspace)/components/confirm-modal.tsx
- [X] T035 [US6] 將 ProjectList 刪除流程統一改為 deferred delete（5 秒後才呼叫 DELETE）：app/(workspace)/components/project-list.tsx
- [X] T036 [US6] 將 PromptList 刪除流程統一改為 deferred delete（5 秒後才呼叫 DELETE）：app/(workspace)/components/prompt-list.tsx
- [X] T037 [US6] 將 Prompt Detail 的刪除入口改走共用 deferred delete（避免立即永久刪除）：app/(workspace)/workspace-shell.tsx
- [X] T038 [US6] Scratchpad 的刪除/清空動作改為 Confirm + Snackbar Undo（5 秒）：app/(workspace)/components/scratchpad.tsx

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T039 [P] 驗證並（如需要）修正 createdAt/updatedAt 與 ISO+08:00 自動補值（涵蓋所有實體 schema）：lib/types/schema.ts
- [X] T040 [P] 同步 quickstart 與規格的用語（編輯/預覽 Tabs、Undo 5 秒、409 三選一）：specs/001-local-prompt-manager/quickstart.md
- [X] T041 [P] 更新 research 的 gap closure 註記（server 主導 updatedAt 已落實）：specs/001-local-prompt-manager/research.md
- [X] T042 [P] 執行並確認基本檢核通過（typecheck/test）：package.json

- [X] T060 [P] 效能量測：列表載入、Prompt Detail 讀寫、autosave 的 p95 測量與記錄：docs/perf-checks.md
- [X] T061 [P] 覆蓋率門檢核：單元 ≥80%，關鍵路徑 100%（記錄落差與修正清單）：docs/perf-checks.md
- [X] T062 [P] FR-035 落地檢核：Project/Prompt/Inbox/Snippet/Settings 的 createdAt/updatedAt 自動補值與更新規則逐一驗證：lib/types/schema.ts

- [X] T067 [P] Prompts 版面對齊 prototype：改為 Main/Side 兩欄 shell，Side 放 KPI + 片語面板並套用 pm tokens：app/(workspace)/workspace-shell.tsx, app/(workspace)/components/snippet-panel.tsx, app/globals.css

---

## Dependencies & Execution Order

### User Story Dependencies

- US1（P1）是 UI 框架層，建議先做。
- US2（P1）與 US3（P1）在 Foundational 後可並行，但都依賴 US1 的 Shell/Tabs。
- US4（P1）依賴 US3（可從列表進入詳情）與 US1（Shell/Tabs）。
- US5（P1）依賴 US1（Shell/Tabs）與 Foundational 的 store 結構。
- US6（P1）依賴 Foundational 的 SnackbarUndo，並在 US2/US3/US5 完成後套用各刪除入口。

### Completion Order（建議交付）

Phase 1 → Phase 2 → US1 →（US2 + US3 並行）→ US4 → US5 → US6 → Polish

---

## Parallel Execution Examples（per story）

### US1

- 可並行：T012（Topbar Tabs）與 T014（Tab placeholder views）

### US3

- 可並行：T020（Prompts 列表對齊）與 T017（Projects 列表對齊）

### US4

- 可並行：T021（PromptEditor Tabs）與 T024（後端 updatedAt server 主導）

### US6

- 可並行：T035（ProjectList deferred delete）與 T036（PromptList deferred delete）

---

## Implementation Strategy

- MVP 建議先做 US1：先把 Tabs/Shell 跑起來，確保 prototype 的 IA 可演示。
- 第二步做 US3 + US4：先有列表可進入，再補齊 Prompt Detail 的核心工作流（編輯/預覽 + autosave + copy + 409 三選一）。
