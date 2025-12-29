# Data Model vs Zod Schema 差距（Phase 1）

## Project
- data-model 要求 `status` 為 TaxonomyValue（`ACTIVE/PAUSED/ARCHIVED` + `code/name` 雙寫入）；現行 schema 只接受字串枚舉 `planned/active/archived/規劃中/進行中/已結案`，無 TaxonomyValue。
- data-model 必填 `summary/projectType/tags(TaxonomyValue[])`；schema 完全缺少這三個欄位與 taxonomy 驗證/去重。
- data-model `projectType/tags` 需對齊內建 taxonomy 並驗證 code/name 一致；schema 無任何驗證。
- docPath/path 缺少「須位於 rootPath/Prompts/{project}/README.md」的格式檢查（目前僅 string）。

## Prompt
- data-model 規定 frontmatter/列表需含 taxonomy 欄位：`category/promptStage/platformTags/audienceTags/deliverableTags/tags` 全為 TaxonomyValue[]；schema 僅有 `tags: string[]`，其餘欄位不存在。
- prompt status/type 等仍為舊版 string 枚舉（未使用 TaxonomyValue），未驗證 taxonomy code/name。
- data-model 使用 `projectId`（或 projectName）供列表/關聯；schema frontmatter 只有 `project`，列表型別 `projectId` 也未對應 taxonomy。
- data-model 要求 taxonomy array 去重 by code；schema 目前只去重 string tags。

## Settings
- data-model 要求 `logPath` 限制在 user 目錄或 rootPath；schema 僅檢查長度，未做路徑範圍驗證（目前由 route handler 層處理）。

## Cross-cutting
- 缺少 TaxonomyValue 型別/schema（code+name 雙寫入、一致性驗證）供 Project/Prompt 重用。
- 時間格式已用 `ISO_UTC8_REGEX` 符合 data-model 的 UTC+08:00 規定；其餘欄位差異如上需以 Zod schema 補齊。
