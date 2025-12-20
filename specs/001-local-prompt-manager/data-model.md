# Data Model（Phase 1）

## Entities

### Project（專案）
- `id`: string（UUID）
- `name`: string（唯一）
- `description`: string
- `status`: enum {規劃中, 進行中, 已結案, 暫停}
- `promptCount`: number
- `updatedAt`: ISO string
- `createdAt`: ISO string
- `path`: string（檔案系統路徑，可由 name 推導）

### InboxItem（收件匣草稿）
- `id`: string
- `title`: string
- `content`: string
- `hint`: string
- `createdAt`: ISO string
- `updatedAt`: ISO string

### Prompt（提示詞 Markdown 檔案）
- `id`: string（檔名雜湊或 UUID）
- `project`: string（Project.name）
- `title`: string
- `type`: enum {角色設定, 產碼, 文案, RAG 調教, 結構分析, 其他}
- `status`: enum {Draft, Stable, Deprecated}
- `model`: string
- `tags`: string[]
- `notes`: string
- `updatedAt`: ISO string
- `body`: string（Markdown 本文）

### Snippet（片語）
- `id`: string
- `name`: string
- `category`: enum {角色, 格式, 限制, 語氣, 其他}
- `content`: string
- `usage`: number
- `lastUsedAt`: ISO string | null

### Settings（設定）
- `rootPath`: string
- `telemetryEnabled`: boolean
- `updateCheckEnabled`: boolean

## Relationships
- Project 1 - N Prompt（檔案路徑：`rootPath/ProjectName/{SafeTitle}.md`）
- InboxItem 無專案關聯，轉正後成為 Prompt 並移除 InboxItem
- Snippet 與 Prompt 無直接外鍵，於編輯器插入時僅更新 usage

## Validation / Rules
- 檔名需經 `sanitizeFilename(title)`；若衝突可追加尾碼。
- Frontmatter 必須包含 `title/project/type/status/model/tags/updatedAt/notes`；缺失時降級顯示並允許修復。
- 專案名稱唯一；草稿轉正時專案必須存在。
- 自動儲存：2 秒節流，無輸入暫停；外部衝突需提示。
