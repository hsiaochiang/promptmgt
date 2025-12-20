# Tech Stack
* **Core Platform**: Electron (latest stable) - 用於構建跨平台桌面應用程式，提供 File System 存取權限。
* **Frontend Framework**: React 18+ (使用 Vite 建置) - 延續現有 UI Prototype (.jsx) 的開發邏輯。
* **Language**: TypeScript - 確保型別安全，特別是在處理檔案結構與 Metadata 介面時。
* **Styling**: Tailwind CSS - 配合現有 Prototype 的樣式類別 (class-based styling)。
* **State Management**: Zustand - 輕量級狀態管理，處理專案列表、選取狀態與草稿暫存。

# Architecture
* **Pattern**: Electron IPC (Inter-Process Communication)
    * **Main Process (Backend)**: 負責所有「副作用」操作，包括讀寫本地檔案、執行 Git 指令、系統對話框。
    * **Renderer Process (Frontend)**: 負責 UI 呈現、編輯器互動、資料過濾與搜尋邏輯。
* **Data Flow**:
    * 啟動時，Main Process 掃描指定根目錄 (Root Dir)，解析所有資料夾與 `.md` 檔。
    * 將解析後的 Metadata (JSON tree) 傳送給 Renderer 渲染。
    * Renderer 觸發存檔時，透過 IPC 通知 Main Process 寫入磁碟。

# Database & Storage Design
* **Storage Strategy**: File-System-as-Database (無傳統 DB)。
* **Directory Structure**:
    ```text
    ~/My-Prompts/                  # 使用者指定的根目錄
      ├── .settings.json           # 應用程式設定 (片語庫存於此或獨立 JSON)
      ├── snippets.json            # 片語資料庫 (JSON 格式以便快速讀取)
      ├── Project-A/               # 專案資料夾
      │     ├── .project-meta.json # (Optional) 專案額外資訊
      │     ├── prompt-1.md
      │     └── prompt-2.md
      └── Project-B/
    ```
* **File Format (Prompt)**:
    * 使用 **YAML Frontmatter** 儲存元數據 (標籤、狀態、模型)。
    * 範例：
      ```markdown
      ---
      title: "RAG 實作說明"
      type: "RAG 調教"
      status: "active"
      tags: ["RAG", "教學"]
      model: "Gemini"
      updatedAt: "2025-12-09"
      ---
      # 角色設定
      ...
      ```

# 3rd Party Libraries
* **File System & Formatting**:
    * `gray-matter`: 用於解析與字串化 Markdown 檔案中的 YAML Frontmatter。
    * `chokidar`: 監聽檔案系統變更，實現外部修改時的即時同步。
* **Editor**:
    * `react-markdown` (預覽用) 或 `monaco-editor` / `@uiw/react-codemirror` (編輯用)。建議使用 CodeMirror 以獲得較好的 Markdown 編輯體驗 (高亮、折疊)。
* **Version Control**:
    * `simple-git`: 在 Electron Main Process 中執行 Git 指令 (add, commit, log, status)。
* **UI Components**:
    * `lucide-react`: 圖示庫 (符合 Prototype 風格)。
    * `clsx` / `tailwind-merge`: 處理 CSS class 條件渲染。

# Implementation Steps
1.  **Project Initialization**: 設定 Electron + Vite + React + TypeScript 專案結構。
2.  **Layout Migration**: 將 `ui_prototype.jsx` 移植為 React Components (`Sidebar`, `PromptList`, `Editor`, `SnippetPanel`)。
3.  **File System Service (Main Process)**:
    * 實作 `scanDirectory()`: 遞迴讀取資料夾與 MD 檔。
    * 實作 `saveFile()`: 整合 `gray-matter` 寫入 Frontmatter 與內容。
4.  **State Management Integration**: 使用 Zustand 串接 UI 與檔案資料流。
5.  **Editor Enhancement**: 整合 CodeMirror，實作語法高亮與 Snippet 插入功能。
6.  **Search & Filter Logic**: 在前端實作基於記憶體的全文搜尋 (可搭配 `fuse.js` 模糊搜尋)。
7.  **Git Integration**: 實作基礎 Git 狀態讀取 (顯示這份 Prompt 是否有未 Commit 的變更)。