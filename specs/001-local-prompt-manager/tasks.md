
---

# Tasks: 原型對齊提示詞工作台（001-local-prompt-manager）

**Input**：`specs/001-local-prompt-manager/`（plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md）
**Tech**：TypeScript / Next.js 14 App Router / React 18 / Tailwind / Zod / LowDB

> 測試為必做：依 `spec.md` 的 Testing / Quality Gates 與 Constitution，採 test-first（先更新/新增測試並確保先失敗，再實作使其通過）。

## Checklist Format（REQUIRED）

每個 task 必須符合：

`- [ ] T001 [P?] [US?] 描述（含檔案路徑）`

規則：

- `[P]`：可並行（不同檔案、無未完成依賴）
- `[US#]`：僅用於 User Story phases（Setup/Foundational/Polish 不加）
- 每個 task 描述必須包含明確檔案路徑

---

## Phase 1: Setup（專案基線）

**Purpose**：確認本 feature 的輸入文件、指令與品質閘門可用（不做任何 user story 實作）。

 - [X] T001 確認 plan/spec/research/data-model/contracts/quickstart 內容一致且可追溯：specs/001-local-prompt-manager/{plan.md,spec.md,research.md,data-model.md,contracts/openapi.yaml,quickstart.md}（結果：核心需求一致，落差列於 route-handler-checklist.md、schema-gaps.md）
 - [X] T002 確認 npm scripts（dev/test/test:contract/typecheck）可用並記錄於 quickstart：package.json
 - [X] T003 [P] 建立「合約文件 vs Route Handlers」比對清單（端點/錯誤碼/409 details）：specs/001-local-prompt-manager/contracts/openapi.yaml（見 contracts/route-handler-checklist.md）
 - [X] T004 [P] 建立「資料模型 vs Zod schema」差距清單（TaxonomyValue/欄位/時間規範）：lib/types/schema.ts（見 schema-gaps.md）

---

## Phase 2: Foundational（阻塞性共用基礎）

**Purpose**：所有 user story 共用且會阻塞後續實作的基礎能力（完成後 US1~US6 可並行）。

- [X] T005 建立 TaxonomyValue 與驗證 helper（code+name 雙寫入、一致性驗證、array 去重）：lib/utils/taxonomy.ts
- [X] T006 [P] 建立 Prompt taxonomy 內建表（category/promptStage/platform/audience/deliverable/commonTags）：lib/ui/promptTaxonomy.ts
- [X] T007 [P] 建立 Project taxonomy 內建表（projectStatuses/projectTypes/commonTags；沿用/擴充現有 options）：lib/ui/projectMetaTaxonomy.ts
- [X] T008 更新 Zod schema：Project 與 Prompt frontmatter 改用 TaxonomyValue 並符合欄位必填/補值策略：lib/types/schema.ts
- [X] T009 統一 API 錯誤回應格式（400/404/409 → {code,message,details?}）：app/api/_lib/responses.ts
- [X] T010 [P] 建立 MarkdownPreview 元件（搭配 react-markdown + sanitize；樣式最小可用）：app/(workspace)/components/markdown-preview.tsx
- [X] T011 [P] 建立 EditorTabs 元件（編輯/預覽互斥；ARIA role/鍵盤操作）：app/(workspace)/components/editor-tabs.tsx
- [X] T012 [P] 建立 SnackbarUndo 元件（5 秒倒數、Undo/Close、可取消 timeout）：app/(workspace)/components/snackbar-undo.tsx
- [X] T013 [P] 建立 ConfirmModal 元件（focus trap、Esc、回復焦點）：app/(workspace)/components/confirm-modal.tsx

**Checkpoint**：Foundation ready（已具備 taxonomy/schema/error/UI primitives）。

---

## Phase 3: User Story 1 - Workspace Shell + Topbar Tabs（Priority: P1）

**Goal**：依 prototype 提供 Topbar Tabs（Projects / Prompts / Scratchpad）與固定 Main/Side Shell；rootPath 缺失/不可存取時顯示全站提示但不阻擋瀏覽。

**Independent Test**：

- 可用鍵盤切換 Tabs（左右鍵、Enter/Space），且 aria-selected/tabpanel 正確
- rootPath 無效時仍可切換 Tabs，RootPathAlert 顯示且可導向 Settings

### Tests（先寫且先失敗）

- [X] T014 [P] [US1] 整合測試：Topbar Tabs 切換時 Main/Side 內容正確切換：tests/integration/us1-shell-tabs-rootpath.test.tsx
- [X] T015 [P] [US1] a11y 整合測試：Tabs 鍵盤操作與 ARIA（tablist/tab/tabpanel）：tests/integration/us1-shell-tabs-a11y.test.tsx
- [ ] T016 [P] [US1] 契約測試：GET/POST /api/settings rootPath 驗證與錯誤格式：tests/contract/api-settings.test.ts

### Implementation

- [ ] T017 [US1] 實作 Topbar Tabs（Projects/Prompts/Scratchpad）狀態與 UI：app/(workspace)/components/top-bar.tsx
- [ ] T018 [US1] 在 Workspace Shell 實作 activeTab 切換並渲染 Main/Side：app/(workspace)/workspace-shell.tsx
- [ ] T019 [US1] 實作 RootPathAlert（全站提示、不阻擋、可導向設定頁）：app/(workspace)/components/root-path-alert.tsx
- [ ] T020 [US1] Settings UI：rootPath 表單、儲存、可操作錯誤訊息：app/(workspace)/settings/page.tsx
- [ ] T021 [US1] Settings API：rootPath 存取性檢查（不可存取 → 400 + details）：app/api/settings/route.ts

---

## Phase 4: User Story 2 - Projects + Project Detail + README（Priority: P1）

**Goal**：Projects 列表卡片完整呈現 `summary/status/projectType/tags/promptCount/updatedAt`，並提供 Project Detail 的 README 編輯/預覽/儲存與 409 衝突處理。

**Independent Test**：

- 可建立專案（含 taxonomy 欄位），重名回 409
- 列表可依搜尋/狀態/分類/標籤篩選
- Project README 可 GET/PUT；外部修改時 PUT 回 409 並含 currentHash/currentMtime

### Tests（先寫且先失敗）

- [ ] T022 [P] [US2] 契約測試：/api/projects CRUD（含 taxonomy 欄位與 409）：tests/contract/api-projects-prompts.test.ts
- [ ] T023 [P] [US2] 契約測試：/api/projects/:id/readme GET/PUT（含 409 details）：tests/contract/api-project-readme.test.ts
- [ ] T024 [P] [US2] 契約測試：/api/projects/:id/meta 讀寫 taxonomy（code+name 一致性驗證）：tests/contract/api-project-meta.test.ts
- [ ] T025 [P] [US2] 整合測試：Project Detail README 編輯/預覽/儲存與錯誤提示：tests/integration/us2-project-readme.test.tsx

### Implementation

- [ ] T026 [US2] 更新 Project 資料模型儲存（summary/projectType/tags/status）與預設 summary 推導：lib/db/fs/projects.ts
- [ ] T027 [US2] 更新 /api/projects：支援新欄位、篩選參數（q/status/projectType/tag/limit）、重名 409：app/api/projects/route.ts
- [ ] T028 [US2] 更新 /api/projects/:id/meta：讀寫 `_meta.json` 並驗證 taxonomy code+name：app/api/projects/[id]/meta/route.ts
- [ ] T029 [US2] 更新 /api/projects/:id/readme：GET/PUT、寫入衝突偵測與 409 details：app/api/projects/[id]/readme/route.ts
- [ ] T030 [US2] Projects 列表 UI：卡片欄位與篩選器對齊 prototype：app/(workspace)/components/project-list.tsx
- [ ] T031 [US2] Project Meta UI：可編輯 taxonomy chips（Enter 新增、可移除、清空）：app/(workspace)/components/project-meta.tsx
- [ ] T032 [US2] Project README UI：編輯/預覽 Tabs、儲存、409 時三選一（重新載入/另存副本/強制覆寫）：app/(workspace)/components/project-readme.tsx

---

## Phase 5: User Story 3 - Prompts（列表）（Priority: P1）

**Goal**：Prompts 列表可依 prototype 的條件篩選（category + promptStage + platformTag + tag + q），並可點擊進入 Prompt Detail。

**Independent Test**：

- /api/prompts 支援新 query params 且最多回 1000 筆
- UI 篩選器操作後列表可收斂，點擊可進入 Prompt Detail

### Tests（先寫且先失敗）

- [ ] T033 [P] [US3] 契約測試：/api/prompts list filtering（category/promptStage/platformTag/tag/q/limit）：tests/contract/api-projects-prompts.test.ts
- [ ] T034 [P] [US3] 整合測試：Prompts 列表篩選與導覽到 detail：tests/integration/us3-prompts-nav.test.tsx

### Implementation

- [ ] T035 [US3] 更新 /api/prompts：支援新篩選參數並以 updatedAt desc 排序：app/api/prompts/route.ts
- [ ] T036 [US3] 更新 PromptListItem schema（tags 改為 TaxonomyValue[] 等）：lib/types/schema.ts
- [ ] T037 [US3] Prompts 列表 UI：新增 prototype 篩選器（category/stage/platform/tag）與 KPI：app/(workspace)/components/prompt-list.tsx

---

## Phase 6: User Story 4 - Prompt Detail（編輯/預覽 + autosave + 複製 + 409 三選一）（Priority: P1）

**Goal**：Prompt Detail 提供 Markdown 編輯/預覽 Tabs、2 秒 autosave（無輸入不觸發）、精簡/完整複製，並在 409 衝突時提供三選一。

**Independent Test**：

- 停止輸入 2 秒觸發 autosave，且 updatedAt 以 server 回傳為準（client 不能當權威）
- 409 時顯示三選一：重新載入 / 另存副本 / 強制覆寫
- 精簡複製只複製 body；完整複製包含 frontmatter + body

### Tests（先寫且先失敗）

- [ ] T038 [P] [US4] 契約測試：/api/prompts/:id GET/POST（server 主導 updatedAt、409 details）：tests/contract/api-prompts-detail.test.ts
- [ ] T039 [P] [US4] 整合測試：Prompt Detail 編輯→2 秒 autosave→預覽切換：tests/integration/us4-prompt-detail-core.test.tsx
- [ ] T040 [P] [US4] 整合測試：409 三選一流程（reload/save copy/force overwrite）：tests/integration/us4-conflict-three-way.test.tsx
- [ ] T041 [P] [US4] 單元測試：frontmatter 必填欄位補值與驗證（TaxonomyValue/時間格式）：tests/unit/frontmatter.test.ts

### Implementation

- [ ] T042 [US4] Frontmatter 讀寫：新增 taxonomy 欄位（category/promptStage/platformTags/audienceTags/deliverableTags/tags）並做一致性驗證：lib/utils/frontmatter.ts
- [ ] T043 [US4] 更新 /api/prompts/:id：以 clientHash/clientMtime 做衝突偵測；成功寫入一律 server 更新 updatedAt：app/api/prompts/[id]/route.ts
- [ ] T044 [US4] 更新 /api/prompts POST：建立新提示詞時自動補齊 createdAt/updatedAt（UTC+08:00）：app/api/prompts/route.ts
- [ ] T045 [US4] Prompt Editor：改為 EditorTabs（編輯/預覽互斥），預覽使用 MarkdownPreview：app/(workspace)/components/prompt-editor.tsx
- [ ] T046 [US4] Autosave hook：2 秒 debounce、成功後以 server 回傳 updatedAt 更新 UI：app/(workspace)/hooks/useAutosavePrompt.ts
- [ ] T047 [US4] Conflict dialog：三選一 UI 與行為（reload/save copy/force overwrite）：app/(workspace)/components/conflict-dialog.tsx
- [ ] T048 [US4] Copy actions：精簡/完整複製並顯示 Toast/Snackbar 回饋：app/(workspace)/components/prompt-header.tsx

---

## Phase 7: User Story 5 - Scratchpad（剪貼簿）（Priority: P1）

**Goal**：Scratchpad 以 localStorage 持久化，不依賴 rootPath；提供新增、列表、複製與 Side count。

**Independent Test**：新增/編輯/複製後 count 正確更新；重整頁面後資料仍在。

### Tests（先寫且先失敗）

- [ ] T049 [P] [US5] 整合測試：Scratchpad 新增/複製/刪除與 count 更新：tests/integration/us5-scratchpad.test.tsx

### Implementation

- [ ] T050 [US5] Scratchpad 元件（Main：輸入+列表；Side：動作+count）：app/(workspace)/components/scratchpad.tsx
- [ ] T051 [US5] Workspace store：加入 scratchpad 狀態與 localStorage key/節流寫入：app/(workspace)/store/useWorkspaceStore.ts

---

## Phase 8: User Story 6 - 刪除 + Undo（5 秒 deferred delete）（Priority: P1）

**Goal**：Project/Prompt/Scratchpad 的刪除皆採 Confirm → Snackbar Undo（5 秒）；5 秒內 Undo 可完整復原；逾時才執行永久刪除。

**Independent Test**：

- 任一刪除確認後顯示 Undo；5 秒內 Undo 不會呼叫 API delete
- 超過 5 秒才呼叫 API delete 並刷新列表

### Tests（先寫且先失敗）

- [ ] T052 [P] [US6] 整合測試：deferred delete + Undo 5 秒（Projects/Prompts/Scratchpad）：tests/integration/us6-deferred-delete-undo.test.tsx

### Implementation

- [ ] T053 [US6] Projects 刪除流程改為 deferred delete（timeout 後呼叫 DELETE /api/projects）：app/(workspace)/components/project-list.tsx
- [ ] T054 [US6] Prompts 刪除流程改為 deferred delete（timeout 後呼叫 DELETE /api/prompts/:id）：app/(workspace)/components/prompt-list.tsx
- [ ] T055 [US6] Scratchpad 刪除/清空流程改為 Confirm + SnackbarUndo：app/(workspace)/components/scratchpad.tsx
- [ ] T056 [US6] Workspace Shell 掛載共用 SnackbarUndo 容器並支援多個 pending deletes：app/(workspace)/workspace-shell.tsx

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**：跨 story 的一致性、文件同步、效能與品質閘門收尾。

- [ ] T057 [P] 同步合約文件與實作（含 409 details 與 query params）：specs/001-local-prompt-manager/contracts/{openapi.yaml,api.md}
- [ ] T058 [P] 同步 quickstart 與 UI 用語（編輯/預覽 Tabs、Undo 5 秒、409 三選一）：specs/001-local-prompt-manager/quickstart.md
- [ ] T059 [P] 覆蓋率與測試金字塔檢核（unit≥80%、關鍵路徑 100%）並記錄落差：vitest.config.ts
- [ ] T060 執行 typecheck/test/contract tests 並確保全綠：package.json
- [ ] T061 [P] 效能量測步驟與記錄格式對齊 spec NFR（p95/1000 上限），並確保可重複執行：docs/perf-checks.md
- [ ] T062 [P] 執行效能量測腳本並記錄結果（list load / prompt read/write / autosave p95）：scripts/perf-test.ts, docs/perf-checks.md
- [ ] T063 [P] FR-035 回歸：補齊/確認 Inbox timestamps（createdAt/updatedAt +08:00 自動補值與更新規則）：tests/contract/api-inbox.test.ts, tests/contract/api-inbox-pagination.test.ts
- [ ] T064 [P] FR-035 回歸：補齊/確認 Snippets timestamps（createdAt/updatedAt +08:00、自動補值與更新規則）：tests/contract/api-snippets.test.ts
- [ ] T065 [P] FR-035 回歸：補齊/確認 Settings timestamps（含 update-check 路徑不破壞）：tests/contract/api-settings.test.ts, tests/contract/api-settings-update-check.test.ts

---

## Dependencies & Execution Order

### User Story Dependencies

- US1 依賴 Phase 2（EditorTabs/RootPathAlert primitives）；完成後為其他 stories 的 UI 基礎。
- US2、US3 可在 US1 後並行（同屬 P1）。
- US4 依賴 US3（可從列表進入詳情）與 Foundation（EditorTabs/MarkdownPreview/統一錯誤格式）。
- US5 依賴 US1（Shell/Tabs）即可。
- US6 依賴 Foundation（ConfirmModal/SnackbarUndo）並套用到 US2/US3/US5 的刪除入口。

### Completion Order（建議）

Phase 1 → Phase 2 → US1 →（US2 + US3 並行）→ US4 → US5 → US6 → Polish

---

## Parallel Execution Examples（per story）

### US1

- 可並行：T014（整合測試）與 T015（a11y 測試）
- 可並行：T017（Topbar）與 T019（RootPathAlert）

### US2

- 可並行：T022（projects 合約測試）與 T023（readme 合約測試）
- 可並行：T027（/api/projects）與 T029（/api/projects/:id/readme）

### US4

- 可並行：T038（契約測試更新）與 T041（frontmatter 單元測試）
- 可並行：T045（PromptEditor UI）與 T043（/api/prompts/:id 衝突偵測）

### US6

- 可並行：T053（Projects deferred delete）與 T054（Prompts deferred delete）

---

## Implementation Strategy

### MVP 建議

- 建議 MVP 先交付 US1（Shell + Tabs + RootPathAlert），先把 prototype 的 IA 跑起來並可演示。

### 增量交付

- US2/US3 補齊列表與導覽 → US4 補齊 Prompt 核心工作流 → US5/US6 補齊剪貼簿與刪除 Undo。
