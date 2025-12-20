# Implementation Plan: 本機提示詞管理系統（GUI/核心流程）

**Branch**: `001-local-prompt-manager` | **Date**: 2025-12-20 | **Spec**: `/specs/001-local-prompt-manager/spec.md`
**Input**: Feature specification from `/specs/001-local-prompt-manager/spec.md`

## Summary

落地本機提示詞管理：雙層儲存（LowDB + 檔案系統 Markdown），支援收件匣草稿自動儲存、專案歸檔、Markdown 編輯與複製、片語插入。自動儲存間隔 2 秒，無輸入時暫停，恢復輸入再計時。

## Technical Context

**Language/Version**: TypeScript, Next.js 14 (App Router), React 18  
**Primary Dependencies**: LowDB、gray-matter、@uiw/react-codemirror、TailwindCSS、Zustand  
**Storage**: LowDB (`db.json`) + 檔案系統 Markdown（`Prompts/{Project}/{SafeTitle}.md`）  
**Testing**: Vitest（contract / unit / integration），覆蓋率門檻 ≥80%，關鍵路徑 100%  
**Target Platform**: 本機瀏覽器（桌面）  
**Project Type**: 單一 Next.js 應用  
**Performance Goals**: 搜尋/複製/自動存取均在 2–3 秒內完成；啟動載入 50 專案/500 提示詞 ≤5 秒  
**Constraints**: 離線本機運行；檔名需經合法化；外部檔案修改需提示並避免覆寫  
**Scale/Scope**: 專案 ≤100、單專案提示詞 ≤500、片語 ≤200

## Constitution Check

- 語言：文件須為繁體中文（符合 Principle V）
- 測試：TDD、覆蓋率 80%+，關鍵路徑 100%（Principle II）
- UX：一致、可及性、即時驗證與指引（Principle III）
- 效能：遵守 SC-004/008 等時間門檻（Principle IV）
- 現狀：無已知違反；後續設計與實作需保持繁中與測試覆蓋

## Project Structure

### Documentation (this feature)

```text
specs/001-local-prompt-manager/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code（實際）

```text
app/
  (workspace)/
    workspace-shell.tsx
    inbox-workspace.tsx
    actions/archiveDraft.ts
    components/
      project-list.tsx
      inbox-list.tsx
      draft-editor.tsx
      prompt-list.tsx
      prompt-editor.tsx
      prompt-header.tsx
      snippet-panel.tsx
      error-boundary.tsx
      top-bar.tsx
    hooks/
      useAutosaveDraft.ts
      useAutosavePrompt.ts
      useSnippetInsert.ts
    store/useWorkspaceStore.ts
  api/
    projects/route.ts
    inbox/route.ts
    inbox/[id]/route.ts
    prompts/route.ts
    prompts/[id]/route.ts
    snippets/route.ts
    snippets/[id]/usage/route.ts
    settings/route.ts
    search/route.ts
lib/
  db.ts
  fs/prompts.ts
  services/{cache,conflict,search,settings,telemetry}.ts
  utils/{clipboard,frontmatter,sanitizeFilename}.ts
  types/schema.ts
tests/
  contract/*
  integration/*
  unit/*
```

**Structure Decision**: 單一 Next.js 專案，前後端同 repo；App Router + LowDB + FS；測試位於 tests/{contract,integration,unit}。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 無 | N/A | N/A |
