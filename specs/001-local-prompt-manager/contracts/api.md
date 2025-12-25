# API Contracts（摘要）

## Projects
- `GET /api/projects` → 200: Project[]
- `POST /api/projects` body: { name, description?, status? } → 200: Project
- `PATCH /api/projects` body: { id, name?, status?, promptCount? } → 200: Project

## Inbox
- `GET /api/inbox` → 200: InboxItem[]
- `POST /api/inbox` body: { title, content, hint } → 200: InboxItem
- `PATCH /api/inbox/{id}` body: { title?, content?, hint? } → 200: InboxItem
- `DELETE /api/inbox/{id}` → 200

## Prompts
- `GET /api/prompts?projectId=` → 200: PromptListItem[]（含 type/status/model/tags/updatedAt/projectId）
- `GET /api/prompts/{id}` → 200: { frontmatter, body, hash }
- `POST /api/prompts/{id}` body: { frontmatter, body, clientHash } → 200: { hash, updatedAt }；409 on conflict

## Snippets
- `GET /api/snippets` → 200: Snippet[]
- `POST /api/snippets` body: { name, category, content } → 200: Snippet
- `PATCH /api/snippets` body: { id, name?, category?, content? } → 200: Snippet
- `POST /api/snippets/{id}/usage` → 200: Snippet（usage+1）

## Settings
- `GET /api/settings` → 200: { rootPath, telemetryEnabled, updateCheckEnabled, logPath, pinned?, layout?, fontScale? }
- `POST /api/settings` body: { rootPath?, telemetryEnabled?, updateCheckEnabled?, logPath?, pinned?, layout?, fontScale? } → 200: same

## Search
- `GET /api/search?q=&projectId=&limit<=1000` → 200: matches[]（含 highlight offsets, truncated flag when >1000）

## Server Action
- `archiveDraft(payload)`
  - input: { draftId, projectName, frontmatter, body }
  - side effects: 寫入 Markdown、移除 inbox、更新專案計數
  - returns: { filePath }
