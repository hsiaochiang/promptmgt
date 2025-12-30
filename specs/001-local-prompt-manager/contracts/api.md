# API Contracts（摘要）

> 錯誤格式統一：`{ code, message, details? }`（400/404/409）

## 共用型別
- `TaxonomyValue`: `{ code: string; name: string }`
- 規則：taxonomy 欄位必須雙寫入 `code+name`，server 驗證一致性；不一致 → 400

## Projects
- `GET /api/projects?q=&status=&projectType=&tag=&limit=` → 200: Project[]
  - 列表卡片必備欄位：`summary/status/projectType/tags/promptCount/updatedAt`
- `POST /api/projects` body: { name, status, summary, projectType, tags, id? } → 201: Project
- `PATCH /api/projects` body: { id, name?, status?, summary?, projectType?, tags?, promptCount? } → 200: Project
- `DELETE /api/projects` body: { id } → 200: { ok: true }

## Project README
- `GET /api/projects/{id}/readme` → 200: { content, path, hash, mtimeMs }
- `PUT /api/projects/{id}/readme` body: { content, expectedHash?, expectedMtime? } → 200: { path, hash, mtimeMs, updatedAt }；409 on conflict（details: { currentHash, currentMtime }）

## Project Meta
- `GET /api/projects/{id}/meta` → 200: ProjectMeta（對應專案資料夾 `_meta.json`）
- `PUT /api/projects/{id}/meta` body: ProjectMetaUpdateInput → 200: ProjectMeta

## Inbox
- `GET /api/inbox?q=&limit=&offset=` → 200: { items, total, hasMore, limit, offset }
- `POST /api/inbox` body: { title?, content?, hint? } → 201: InboxItem
- `PATCH /api/inbox/{id}` body: { title?, content?, hint?, expectedUpdatedAt? } → 200: InboxItem；409 on conflict
- `DELETE /api/inbox/{id}` → 200: { ok: true }

## Prompts
- `GET /api/prompts?projectId=&status=&q=&category=&promptStage=&platformTag=&tag=&limit=` → 200: PromptListItem[]
- `POST /api/prompts` body: { frontmatter, body? } → 201: { id, projectId, frontmatter, body, hash, mtimeMs }
- `GET /api/prompts/{id}` → 200: { frontmatter, body, hash, mtimeMs, damaged, errorCode?, errorMessage? }
- `POST /api/prompts/{id}` body: { frontmatter, body, clientHash?, clientMtime? } → 200: { hash, mtimeMs, updatedAt }；409 on conflict
- `DELETE /api/prompts/{id}` → 200: { ok: true }

## Snippets
- `GET /api/snippets?q=` → 200: Snippet[]
- `POST /api/snippets` body: { name, category, content } → 201: Snippet
- `PATCH /api/snippets` body: { id, name?, category?, content? } → 200: Snippet
- `GET /api/snippets/{id}` → 200: Snippet
- `PATCH /api/snippets/{id}` body: { name?, category?, content? } → 200: Snippet
- `DELETE /api/snippets/{id}` → 200: { ok: true }
- `POST /api/snippets/{id}/usage` → 200: Snippet（usage+1）

## Settings
- `GET /api/settings` → 200: { rootPath, telemetryEnabled, updateCheckEnabled, logPath, pinned?, layout?, fontScale? }
- `POST /api/settings` body: { rootPath?, telemetryEnabled?, updateCheckEnabled?, logPath?, pinned?, layout?, fontScale?, telemetry? } → 200: same（含 pathExists）

## Search
- `GET /api/search?q=&projectId=&status=&limit<=1000` → 200: { results: SearchMatch[], truncated: boolean }

## Server Action
- `archiveDraft(payload)`
  - input: { draftId, projectName, frontmatter, body }
  - side effects: 寫入 Markdown、移除 inbox、更新專案計數
  - returns: { filePath }
