---

description: "Task list for 001-local-prompt-manager"
---

# Tasks: 本機提示詞管理系統（雙層儲存＋UI Prototype 對應）

**Input**: Design documents from `/specs/001-local-prompt-manager/`
**Prerequisites**: plan.md (required), spec.md (required), research.md (n/a), data-model.md (n/a), contracts/ (n/a)

**Tests**: Not explicitly requested; omit test tasks unless added later.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 (from spec)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and base structure

- [x] T000 [P] Add test tooling setup與覆蓋率門檻（80% min，critical path 100%）於 package.json（建議 vitest/playwright）
- [x] T001 Initialize Next.js 14 App Router project with TypeScript and workspace layout in package.json/app/
- [x] T002 [P] Configure Tailwind (tailwind.config.js, postcss.config.js) and global styles in app/globals.css to match prototype base styles
- [x] T003 [P] Add shadcn/ui setup (components.json), install lucide-react, clsx, tailwind-merge, @uiw/react-codemirror in package.json
- [x] T004 [P] Configure lint/format (eslint, prettier, .editorconfig) with TypeScript/Next rules
- [x] T005 [P] Scaffold folders app/(workspace)/components, app/(workspace)/hooks, app/(workspace)/actions, app/(workspace)/store, lib/{db,fs,services,utils,types}
- [x] T005a [P] Add TopBar component scaffold in app/(workspace)/components/top-bar.tsx（含「今日變更報告」「新增提示詞」按鈕，依 prototype class）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story

- [x] T006 Define TypeScript schemas for LowDB and Frontmatter in lib/types/schema.ts (projects/inbox/snippets/settings + prompt frontmatter)
- [x] T006a [P] Add contract tests for API schemas（projects/inbox/prompts/snippets/settings/search）in tests/contract/*.test.ts
- [x] T006b [P] Add unit tests for adapters/utils（LowDB, fs, frontmatter, conflict, search）in tests/unit/*
- [x] T007 [P] Implement LowDB adapter with seed data from ui_prototype.jsx in lib/db.ts (projects/inbox/snippets/settings)
- [x] T008 [P] Implement file system adapter for prompts in lib/fs/prompts.ts (read/write Markdown with gray-matter) using lib/utils/sanitizeFilename.ts
- [x] T009 [P] Implement frontmatter parser/serializer with damaged-YAML fallback in lib/utils/frontmatter.ts
- [x] T010 Implement settings service for rootPath, telemetryEnabled, updateCheckEnabled in lib/services/settings.ts
- [x] T010a Define telemetry/update payload whitelist（不得包含提示詞內容/檔名全文）、頻率與停用行為，記錄於 docs/settings（或 README 設定章節）
- [x] T011 Implement conflict detection (mtime/hash) utilities in lib/services/conflict.ts for external-change prompts
- [x] T012 Implement search service with 1000-result cap and snippet highlight in lib/services/search.ts
- [x] T013 Wire API route skeletons (app/api/projects/route.ts, app/api/inbox/route.ts, app/api/prompts/route.ts, app/api/snippets/route.ts, app/api/settings/route.ts, app/api/search/route.ts)
- [x] T014 Add Zustand store scaffolding for selection/filter/editor state in app/(workspace)/store/useWorkspaceStore.ts

**Checkpoint**: Foundation ready — user stories can start.

---

## Phase 3: User Story 1 - 收件匣快速草稿捕捉 (Priority: P1) 🎯 MVP

**Goal**: 低摩擦收件匣草稿輸入與自動儲存，列表排序與預覽

**Independent Test**: 開啟應用→輸入草稿→關閉→重開，草稿與最後時間仍在；貼上大段文字時有 loading，不凍結。

### Implementation for User Story 1

- [x] T015 [P] [US1] Implement inbox API (GET/POST/PATCH/DELETE) with autosave timestamps in app/api/inbox/route.ts and app/api/inbox/[id]/route.ts
- [x] T015a [P] [US1] Integration test：autosave + reopen restores draft（tests/integration/us1-draft-autosave.test.ts）
- [x] T016 [P] [US1] Build InboxList component per prototype in app/(workspace)/components/inbox-list.tsx (sorted by updatedAt, show hint/createdAt)
- [x] T017 [P] [US1] Implement DraftEditor with autosave + large-paste loading indicator in app/(workspace)/components/draft-editor.tsx
- [x] T017a [P] [US1] Unit test：large paste shows loading indicator（tests/unit/draft-editor-loading.test.ts）
- [x] T018 [US1] Add useAutosaveDraft hook throttling calls to inbox API and updating store in app/(workspace)/hooks/useAutosaveDraft.ts
 - [x] T019 [US1] Wire inbox count badge in sidebar header in app/(workspace)/components/sidebar-header.tsx

**Checkpoint**: 收件匣草稿可自動保存、排序、預覽並可復原。

---

## Phase 4: User Story 2 - 專案歸檔與列表總覽 (Priority: P1)

**Goal**: 草稿轉正為專案提示詞，專案列表與狀態顯示、提示詞列表檢視

**Independent Test**: 草稿轉正→專案列表數量更新→檔案生成；切換狀態與缺路徑提示均可獨立驗證。

### Implementation for User Story 2

 - [x] T020 [P] [US2] Implement projects API (GET/POST/PATCH status) in app/api/projects/route.ts using LowDB
- [x] T021 [P] [US2] Implement archiveDraft server action in app/(workspace)/actions/archiveDraft.ts (remove inbox entry, write prompt Markdown, update counts)
- [x] T021a [US2] Integration test：archiveDraft moves inbox→file 並更新專案計數（tests/integration/us2-archive-draft.test.ts）
- [x] T022 [P] [US2] Implement prompts listing API scanning filesystem in app/api/prompts/route.ts returning type/status/model/tags/updatedAt/projectId
- [ ] T022a [P] [US2] Contract test：prompts listing API 回傳欄位與排序正確（tests/contract/prompts-listing.test.ts）
- [x] T023 [US2] Build ProjectList component with selection styling per prototype in app/(workspace)/components/project-list.tsx
- [x] T024 [US2] Build PromptList panel with filters/status/model/tag chips in app/(workspace)/components/prompt-list.tsx
- [ ] T024a [US2] Wire TopBar actions：開啟變更報告（placeholder modal）與新建提示詞流程（建立草稿/導向編輯）
- [x] T025 [US2] Add root-path missing alert/relocation UI in app/(workspace)/components/root-path-alert.tsx triggered on invalid project path

**Checkpoint**: 草稿可轉正並出現在專案列表與提示詞清單中；缺路徑時有提示。

---

## Phase 5: User Story 3 - Markdown 編輯與精準複製 (Priority: P1)

**Goal**: 具語法高亮的編輯器、自動保存、完整/精簡複製

**Independent Test**: 開啟提示詞→編輯→預覽→精簡複製；重新載入仍保留改動。

### Implementation for User Story 3

- [x] T026 [P] [US3] Integrate CodeMirror Markdown editor in app/(workspace)/components/prompt-editor.tsx
- [x] T027 [P] [US3] Implement prompt read/write API with conflict checks in app/api/prompts/[id]/route.ts
- [ ] T027a [P] [US3] Contract test：prompt read/write API（含衝突偵測）
- [x] T028 [P] [US3] Implement clipboard utils for full vs trimmed (no frontmatter) copy in lib/utils/clipboard.ts
- [ ] T028a [P] [US3] Unit test：clipboard trims frontmatter for slim copy
- [x] T029 [US3] Build PromptHeader actions (copy buttons, status/model/project pills) in app/(workspace)/components/prompt-header.tsx
- [x] T030 [US3] Add useAutosavePrompt hook with lastSaved indicator in app/(workspace)/hooks/useAutosavePrompt.ts

**Checkpoint**: 提示詞可編輯、保存、完整/精簡複製並顯示狀態。

---

## Phase 6: User Story 4 - 片語剪貼簿插入與統計 (Priority: P2)

**Goal**: 片語搜尋、點擊插入游標、使用次數追蹤

**Independent Test**: 建立片語→搜尋→點擊插入→使用次數+1。

### Implementation for User Story 4

- [x] T031 [P] [US4] Implement snippets API with usage increment in app/api/snippets/route.ts and app/api/snippets/[id]/usage/route.ts
- [ ] T031a [P] [US4] Contract test：snippets usage increment endpoint
- [x] T032 [P] [US4] Build SnippetPanel UI per prototype (search, usage, category pills) in app/(workspace)/components/snippet-panel.tsx
- [x] T033 [US4] Wire snippet insert via editor ref bridge in app/(workspace)/hooks/useSnippetInsert.ts
- [ ] T033a [US4] Integration test：click-to-insert updates usage count
 - [x] T034 [US4] Trigger usage increment on click and refresh list in app/(workspace)/components/snippet-panel.tsx

**Checkpoint**: 片語可搜尋、插入並記錄使用次數。

---

## Phase 7: Polish & Cross-Cutting

- [ ] T035 [P] Add telemetry/update setting toggles UI in app/(workspace)/settings/page.tsx respecting NFR-001
- [ ] T035a [P] Implement telemetry sender + update checker honoring settings（telemetryEnabled/updateCheckEnabled），遵守 payload whitelist（不得含提示內容）；可停用
- [ ] T035b Add unit tests for telemetry opt-out and payload sanitization
- [ ] T036 Cache prompt counts/updatedAt post-scan for projects API in lib/services/cache.ts
- [ ] T037 [P] Add docs for setup/run and API overview in README.md
- [ ] T037a [P] Perf check scripts：SC-003/004（複製/搜尋延遲）、SC-008（啟動 50/500 資料集）、SC-006（外部修改提示 ≤5s）
- [ ] T037b UX check：SC-009/010 首次體驗成功率與卡頓回報率（手動腳本/調查）
- [ ] T038 [P] Add error boundary/loading states for editor and lists in app/(workspace)/components/error-boundary.tsx
- [ ] T039 Verify search cap, large-paste loading, filename sanitizer coverage across flows in app/(workspace)/ and lib/utils
- [ ] T039a [P] Coverage gate enforcement in CI（>=80%，critical path 100%），確保測試未通過時阻擋

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phases 3-6) → Polish (Phase 7)
- User stories unlock after Phase 2; US1, US2, US3 (all P1) can run in parallel if capacity, US4 (P2) follows once base stories stable.
- Within each story: services/serverside before UI wiring; autosave hooks after API ready; copy/snippet utilities after editor ref is exposed.

### User Story Completion Order (graph)
- US1 (P1) → US2 (P1) → US3 (P1) → US4 (P2)
- US1/US2/US3 may run in parallel after Phase 2; US4 depends on editor ref from US3.

### Parallel Execution Examples
- US1: T016 InboxList and T017 DraftEditor in parallel (distinct files); T015 API can start concurrently with UI.
- US2: T020 projects API and T022 prompts list API in parallel; T023 ProjectList UI can start once T020 response shape fixed.
- US3: T026 editor integration and T028 clipboard utils in parallel; T027 API can proceed independently.
- US4: T031 snippets API and T032 SnippetPanel in parallel; T033 insert hook after editor ref (US3) ready.

## Implementation Strategy

### MVP First (US1 only)
1) Finish Phases 1-2
2) Deliver Phase 3 (US1) → validate autosave/restore + loading indicator

### Incremental Delivery
1) US1 (MVP) → demo
2) US2 (archive + lists) → demo
3) US3 (editor + copy) → demo
4) US4 (snippets) → demo

### Parallel Team Strategy
- After Phase 2: Dev A: US1, Dev B: US2, Dev C: US3; Dev D picks US4 after editor ref stable.
