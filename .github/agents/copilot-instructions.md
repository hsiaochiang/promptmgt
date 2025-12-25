# promptmgt Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-21

## Active Technologies
- TypeScript 5.x、Next.js 14（App Router）、Node.js 18 + Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod、gray-matter、@uiw/react-codemirror、localStorage 偏好封裝、自訂 clipboard/frontmatter/date utils (001-local-prompt-manager)
- Markdown 檔（提示詞＋專案 README）+ LowDB（db.json 指標/設定）+ localStorage（Pin/寬度/字級/偏好）。所有時間儲存為 ISO 8601（UTC+08:00），前端依格式化函式顯示 (001-local-prompt-manager)
- TypeScript 5.x、Next.js 14 App Router（Node.js 18+） + Next.js Route Handlers、LowDB、zod、remark/markdown 工具、localStorage 偏好、剪貼簿 API (001-local-prompt-manager)
- Markdown 檔案（Frontmatter + 內容）＋ LowDB JSON（索引/設定/狀態），使用者目錄隱藏資料夾；本機結構化日誌循環檔案 (001-local-prompt-manager)

- TypeScript 5.x、Next.js 14（App Router）、Node.js 18 + Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod（schema 驗證）、localStorage（用戶端偏好）、React Query / SWR 類型資料抓取（現況待確認，若無則補） (001-local-prompt-manager)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x、Next.js 14（App Router）、Node.js 18: Follow standard conventions

## Recent Changes
- 001-local-prompt-manager: Added TypeScript 5.x、Next.js 14 App Router（Node.js 18+） + Next.js Route Handlers、LowDB、zod、remark/markdown 工具、localStorage 偏好、剪貼簿 API
- 001-local-prompt-manager: Added TypeScript 5.x、Next.js 14（App Router）、Node.js 18 + Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod、gray-matter、@uiw/react-codemirror、localStorage 偏好封裝、自訂 clipboard/frontmatter/date utils

- 001-local-prompt-manager: Added TypeScript 5.x、Next.js 14（App Router）、Node.js 18 + Next.js / React 18、Tailwind CSS、lowdb、fs/promises、zod（schema 驗證）、localStorage（用戶端偏好）、React Query / SWR 類型資料抓取（現況待確認，若無則補）

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
