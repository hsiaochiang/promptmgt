# 原型對齊 Implementation Plan：提示詞工作台（UI/UX 以 prototype 為準）

**分支**：`001-local-prompt-manager` | **日期**：2025-12-27 | **規格**：`specs/001-local-prompt-manager/spec.md`

**輸入**：來自 `specs/001-local-prompt-manager/spec.md`（以 `0resource/prototype/` 的畫面與互動為 UI/UX 權威來源；資料層沿用現有系統實作）

## Summary

本次計畫的重點是讓「原型的 UI/UX」與「既有資料層能力」一致對齊：

- UI/UX：Topbar Tabs（專案/提示詞/剪貼簿）+ Main/Side Shell、Toast/Confirm/Snackbar Undo
- Prompt Detail：Markdown 編輯 + 預覽（以「編輯/預覽」Tabs 切換）、2 秒 autosave、完整/精簡複製
- 刪除 Undo：5 秒內可撤銷（以 UI 層 deferred delete 視作 soft delete），逾時才呼叫永久刪除
- 衝突處理：偵測 409/外部修改時，提供「重新載入 / 另存副本 / 強制覆寫」

## Technical Context

**Language/Version**: TypeScript（Node.js 18+；Next.js 14；React 18）  
**語言/版本**：TypeScript + React 18；Node.js 18+；Next.js `^14.1.0`（App Router / Route Handlers）  
**主要依賴**：Tailwind CSS、Zod、LowDB、gray-matter、`@uiw/react-codemirror` + `@codemirror/lang-markdown`  
**儲存**：
- `db.json`（LowDB；projects/inbox/snippets/settings）
- `rootPath` 下的 Markdown 檔（提示詞正文：YAML frontmatter + body；以及每個專案 README）
**測試**：Vitest（含 `tests/contract`、`tests/unit`、`tests/integration`）  
**目標平台**：本機 Web（Windows/macOS；localhost）  
**專案型態**：Web application（Next.js 單 repo；app router + route handlers）  
**效能目標**（可驗收）：
- 互動 API p95 < 200ms（本機，非大量資料）
- 列表/搜尋結果上限 1000，超出需截斷或提示收斂
**限制條件**：離線可用；rootPath 缺失/不可存取時不得靜默失敗；文件/規格/計畫需維持繁體中文  
**規模/範圍**：以 prototype 的五個頁面為 UI 範圍；資料層仍保留既有 inbox/snippets/settings 結構但不擴張其 UI（除非後續 spec 另開）

## Constitution Check

*GATE：Phase 0 前必須通過；Phase 1（Design & Contracts）後再檢查一次。*

### Gate 結果（Pre-Design）

1. **Code Quality First**：OK（計畫要求沿用既有模式：Route Handlers + lib services + zod schema）
2. **Testing Standards**：OK（契約/單元/整合測試既有；本次若調整 API/錯誤格式，需同步更新契約測試）
3. **User Experience Consistency**：OK（以 prototype 做一致性來源；衝突/錯誤訊息需可操作）
4. **Performance Requirements**：OK（列出互動 SLA 與上限；避免全量重算）
5. **Language & Documentation Standards**：OK（本 feature 的 specs 文件皆維持繁體中文）

### Gate 結果（Post-Design）

完成 contracts/data-model/quickstart 更新後再次檢查：OK（無新增語言或測試規範違反）。

## Project Structure

### Documentation（本 feature）

```text
specs/001-local-prompt-manager/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   └── api.md
└── tasks.md
```

### Source Code（repo root）

```text
app/
├── (app)/
├── (workspace)/
└── api/
    ├── projects/
    ├── prompts/
    ├── settings/
    ├── search/
    ├── inbox/
    ├── snippets/
    └── telemetry/

lib/
├── db.ts
├── fs/
├── services/
├── types/
└── utils/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**：採 Next.js App Router（UI：`app/`；API：`app/api/`；領域邏輯：`lib/`；測試：`tests/`）。

## Phase 0：Research（輸出：research.md）

- 釐清/決策：Markdown 預覽的 UI 呈現（選擇 Tabs 切換）、Undo 的 deferred delete 策略、409 衝突 UX（重新載入/另存副本/強制覆寫）、timestamps 更新規則與現況差距
- 更新 `specs/001-local-prompt-manager/research.md` 以對齊最新 Clarifications

## Phase 1：Design & Contracts（輸出：data-model.md、contracts/*、quickstart.md）

- `data-model.md` 以現行 `lib/types/schema.ts` 為準，標註「本次 prototype 對齊必用」與「既有但非本次 UI 重點」
- `contracts/openapi.yaml` 對齊實際 Route Handlers（HTTP method、path、conflict/validation 錯誤碼）
- `quickstart.md` 收斂到 prototype 五頁面流程，移除原型未呈現的快捷鍵/Drawer/專注模式等說明

## Phase 2：Implementation Planning（不在此命令輸出 tasks.md）

- 以 `tasks.md`（由 `/speckit.tasks` 產出）拆分 UI 對齊、契約/錯誤格式一致、以及「timestamps 由系統主導更新」等差距修正工作。
