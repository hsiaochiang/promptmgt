## 實作計畫：提示詞工作台（UI/UX 以原型為準）

**Branch**：`001-local-prompt-manager` | **日期**：2025-12-29 | **Spec**：`specs/001-local-prompt-manager/spec.md`
**Input**：`specs/001-local-prompt-manager/spec.md`

> 本文件由 `/speckit.plan` 工作流填入（本次以 zh-TW 內容補齊）。

## 摘要

本次 feature 以 `0resource/prototype/` 作為 UI/UX 權威來源，維持固定 Shell（Main + Side）與 Topbar Tabs（Projects / Prompts / Scratchpad），並補齊/升級資料層與 API 契約以支援：

- Projects 列表卡片完整欄位（`summary/projectType/tags/status`），以及與 Project Detail 的 `_meta.json` 同步
- Prompts 列表篩選器（category + stage + platform + tag）與 Prompt Detail（Markdown 編輯/預覽 Tabs）
- Autosave（2 秒 debounce）與 409 衝突三選一（重新載入 / 另存副本 / 強制覆寫）
- 刪除 + Undo（Confirm → Snackbar，5 秒 deferred delete）
- 全域 RootPathAlert（rootPath 缺失/不可存取時提示但不阻擋瀏覽）

Phase 0/1 設計輸出：

- `research.md`：決策與替代方案
- `data-model.md`：實體/欄位/驗證與狀態
- `contracts/`：OpenAPI 與摘要契約
- `quickstart.md`：啟動與驗收操作

## 技術背景

**語言/版本**：TypeScript 5.4、Node.js 18+、Next.js 14.1、React 18  
**主要依賴**：Next.js App Router（Route Handlers）、Zod、Zustand、Tailwind CSS、LowDB、gray-matter、react-markdown、CodeMirror  
**儲存**：
- LowDB（`db.json`）保存 projects/inbox/snippets/settings
- 檔案系統（`rootPath`）保存專案資料夾、README、提示詞 Markdown（YAML frontmatter + body）與 `_meta.json`
**測試**：Vitest（含 coverage）、Testing Library（UI/Hook）、Playwright（E2E）  
**目標平台**：本機（Windows/macOS），離線可用（local FS + local JSON DB）  
**專案型態**：Web 應用（Next.js）  
**效能目標**：互動 API p95 < 200ms（本機）；列表/搜尋上限 1000 筆避免 UI 卡頓；需以量測腳本與可重複步驟記錄結果（docs/perf-checks.md + scripts/perf-test.ts）  
**限制**：
- 時間欄位一律 ISO 8601（UTC+08:00）；`createdAt/updatedAt` 自動補值
- taxonomy 欄位雙寫入 `code+name`，且 server 驗證一致性
- 衝突不可靜默覆蓋（409 三選一）
**規模/範圍**：單使用者、本機檔案量中小規模（提示詞/專案數量可達數百；單次列表回傳最多 1000）

## 憲章檢查

*閘門：Phase 0 前必須通過；Phase 1 設計完成後需重新檢查。*

- **I. Code Quality First**：通過（沿用既有 Next.js route handler + `lib/` 分層；命名與錯誤格式一致化）
- **II. Testing Standards（TDD/coverage/contract）**：通過（本 feature 的 API/關鍵路徑需補齊合約測試與關鍵路徑 100% 覆蓋；整體 unit coverage ≥ 80%）
- **III. UX Consistency / a11y**：通過（遵循 prototype Shell 與 Tabs；錯誤訊息可操作；Modal focus trap；Undo 可鍵盤操作）
- **IV. Performance Requirements**：通過（列表/搜尋限制；避免過度 FS 掃描；以快取/索引支援常用路徑；並以 docs/perf-checks.md 記錄 p95 與回歸風險）
- **V. Language & Documentation（zh-TW）**：通過（本次 `specs/001-local-prompt-manager/` 產出以繁中撰寫）

## 專案結構

### 文件（本 feature）

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### 原始碼（repo 根目錄）
```text
app/
├── (app)/               # Workspace UI（Projects / Prompts / Scratchpad 等）
├── (workspace)/         # Workspace shell / hooks / store
└── api/                 # Next.js Route Handlers（/api/*）

lib/
├── db.ts                # LowDB 入口
├── db/                  # lowdb + fs adapters
├── services/            # 快取、衝突、搜尋、設定、遙測
└── types/               # Zod schemas / shared types

tests/
├── contract/            # Route Handlers 合約測試（含 409/錯誤格式）
├── integration/
├── unit/
└── e2e/                 # Playwright
```

**Structure Decision**：採單一 Next.js Web App（App Router）。API 以 `app/api/**/route.ts` 為 public interface；資料層集中於 `lib/`；測試分 contract/integration/unit/e2e。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| 違規項目 | 為何必要 | 為何不採更簡單替代方案 |
|---------|----------|------------------------|
| （無） |  |  |

本次無需額外複雜度豁免。
