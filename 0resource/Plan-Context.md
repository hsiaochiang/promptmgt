# Tech Stack
* **App Framework**: Next.js 14+ (App Router) - 用於構建本機 Web 介面與 API。
* **Runtime**: Node.js (LTS).
* **Language**: TypeScript.
* **Database (System)**: LowDB (v7) - 儲存 Projects meta, Inbox, Snippets, App Settings。
* **Storage (Content)**: Native File System (`node:fs`) - 儲存正式 Prompts (.md 檔)。
* **Styling**: Tailwind CSS + Shadcn/UI + Lucide React (完全對應 UI Prototype)。
* **State Management**: Zustand (管理選取的 Project ID, Prompt ID, UI 面板狀態)。
* **Editor**: `@uiw/react-codemirror` (支援 Markdown 語法高亮)。

# Architecture: The Hybrid Store

該系統不依賴外部資料庫，而是結合「檔案系統」與「JSON DB」。

```text
[UI Layer: React Components]
       |
[Zustand Store] <--- (Sync UI State)
       |
[Next.js API Routes / Server Actions]
       |
       +--- (A) LowDB Adapter (db.json)
       |      - Stores: Projects List, Inbox Drafts, Snippets, User Settings
       |      - Why: Fast read/write for metadata & UI config.
       |
       +--- (B) File System Adapter (Native FS)
              - Stores: /Prompts/{ProjectName}/{Title}.md
              - Why: Git-friendly, portable content.
              - Format: Frontmatter (YAML) + Markdown Body.

# Component Architecture (Based on UI Prototype)

將 `ui_prototype.jsx` 拆解為以下獨立元件：

1. `layout.tsx`：包含全域結構。
2. `TopBar.tsx`：
   - 顯示 App Title, Breadcrumbs。
   - Actions: "今日變更報告", "新增提示詞"。
3. `Sidebar.tsx`：
   - `ProjectList`：讀取 LowDB `projects`，支援選取狀態樣式（`bg-slate-900 text-white`）。
   - `InboxList`：讀取 LowDB `inbox`，渲染黃色虛線框樣式（`border-dashed border-amber-300`）。
4. `PromptListPanel.tsx` (Middle Column):
   - `SearchBar`：搜尋框與篩選按鈕。
   - `PromptList`：渲染 Prompt Items，處理選取狀態（`bg-slate-900/5`）。
5. `WorkspacePanel.tsx` (Right Column):
   - `PromptHeader`：顯示 Meta (Type/Status/Model) 與 複製按鈕（`navigator.clipboard`）。
   - `Editor`：整合 CodeMirror，設定高度 `flex-1`。
   - `SnippetPanel`：
     - 右下角獨立區塊。
     - 包含搜尋框（`input`）。
     - 列表渲染（顯示 `usage` 次數）。
     - 點擊事件：`onInsert(content)`。           


# Database Schema (LowDB: db.json)

```ts
interface DB {
  projects: {
    id: string;
    name: string;
    status: '進行中' | '規劃中' | '已結案';
    // promptCount 與 updatedAt 需在讀取時動態計算或快取
    lastSyncedAt: string;
  }[];

  inbox: {
    id: string;
    title: string;
    content: string; // Draft content
    hint: string;
    createdAt: string;
  }[];

  snippets: {
    id: string;
    name: string;
    category: string;
    content: string;
    usage: number;
  }[];

  settings: {
    rootPath: string; // Markdown 檔案的根目錄路徑
  };
}
```

# Implementation Steps

1. **Project Init:** 建立 Next.js 專案，安裝 `lowdb`, `nanoid`, `gray-matter`, `lucide-react`, `clsx`, `tailwind-merge`。
2. **Styles Migration:** 將 `ui_prototype.jsx` 中的 Tailwind Classes 提取到各個 Component 中，確保視覺還原度 100%。
3. **Backend Setup (LowDB):**
   - 建立 `lib/db.ts` 初始化 JSON DB。
   - 寫入 `ui_prototype.jsx` 中的 `projects` 和 `snippets` 假資料作為初始種子資料 (Seed Data)。
4. **API Development:**
   - `GET /api/projects`：回傳專案列表。
   - `GET /api/prompts?projectId=...`：掃描檔案系統，解析 Frontmatter 回傳列表。
   - `POST /api/snippets/usage`：增加使用計數。
5. **Editor Integration:** 實作 CodeMirror 元件，並建立 `useEditorRef` 以便讓 `SnippetPanel` 觸發文字插入。
6. **File System Sync:** 實作「儲存」功能，將編輯器內容轉為 YAML Frontmatter + Markdown 並寫入硬碟。

# Special Handling

- **Inbox to Project:** 當使用者將 Inbox Item 轉為正式 Prompt 時，需執行：
  1. `db.inbox.remove(id)`
  2. `fs.writeFile(newPath, content)`
  3. 前端重新抓取 Prompt List。