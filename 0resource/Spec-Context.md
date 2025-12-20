# High-Level Goal
建立一個**本機執行 (Localhost Only)** 的個人提示詞管理系統。
系統核心為「雙層儲存架構」：使用 Markdown 檔案儲存提示詞內容以確保通用性與版控能力，並使用輕量化 JSON 資料庫管理系統狀態、統計數據與快取索引。
介面需完全參照提供的 UI Prototype 設計，提供無縫的「收件匣草稿 → 專案歸檔 → 片語組裝」工作流。

# User Stories

## 1. 專案與工作區概覽
* As a User, 我希望在左側側邊欄看到我的「專案列表」，並能一眼看出每個專案的狀態 (進行中/規劃中) 與提示詞數量。
* As a User, 我希望看到「未歸檔收件匣 (Inbox)」，並顯示待整理的草稿數量 (如 "2 筆待整理")，以提醒我處理散落的想法。
* As a User, 我希望介面頂部顯示「今日變更報告」與「新增提示詞」的快速按鈕。

## 2. 提示詞列表與篩選
* As a User, 我希望中間欄位顯示目前選取專案 (或全部) 的提示詞列表。
* As a User, 我希望列表項目能顯示豐富的 Metadata：標題、類型 (如: 簡報生成)、狀態 (如: 使用中)、模型 (如: ChatGPT)、標籤 (Tags) 與更新時間。
* As a User, 我希望透過關鍵字搜尋 (標題/內容/標籤) 或點擊篩選器 (進行中/全部) 來過濾列表。

## 3. 編輯與組裝 (核心體驗)
* As a User, 我希望右側編輯區顯示當前提示詞的「Markdown 編輯器」，並支援語法高亮。
* As a User, 我希望看到編輯區上方顯示提示詞的完整資訊 (標題、狀態、所屬專案)，並提供「複製完整提示詞」與「複製給模型用 (精簡)」的一鍵操作。
* As a User, 我希望編輯器具備「自動儲存」功能，並顯示最後編輯時間。

## 4. 片語剪貼簿 (Snippet Library)
* As a User, 我希望在編輯器右側常駐「常用片語剪貼簿」。
* As a User, 我希望片語列表顯示「使用次數 (Usage)」，讓我能快速找到高頻使用的模組。
* As a User, 我希望點擊片語後，內容能直接插入到左側編輯器的游標位置。

# Domain Models

## Project (專案)
* **Definition**: 業務目標或任務的容器。
* **Attributes**:
    * `id`: Unique String (e.g., "proj-1")
    * `name`: String (專案名稱)
    * `status`: Enum (進行中, 規劃中, 已結案)
    * `promptCount`: Number (計算欄位)
    * `updatedAt`: DateTime String

## InboxItem (收件匣草稿)
* **Definition**: 尚未歸檔的靈感或臨時草稿。
* **Attributes**:
    * `id`: Unique String
    * `title`: String
    * `content`: String (Markdown)
    * `hint`: String (系統建議或備註，如 "候選：AI 工作流課程")
    * `createdAt`: DateTime String

## Prompt (提示詞)
* **Definition**: 正式歸檔的 Markdown 檔案。
* **Attributes**:
    * `id`: Unique String
    * `projectId`: Reference ID
    * `title`: String
    * `content`: String (Markdown Body)
    * `type`: String (e.g., "簡報生成", "RAG 調教")
    * `status`: Enum (草稿, 使用中, 拋棄)
    * `model`: String (e.g., "ChatGPT", "Gemini")
    * `tags`: Array<String>
    * `updatedAt`: DateTime String

## Snippet (片語)
* **Definition**: 可重複使用的文字模組。
* **Attributes**:
    * `id`: Unique String
    * `name`: String
    * `category`: String (e.g., "角色設定", "輸出格式")
    * `content`: String
    * `usage`: Number (使用次數統計)

# Workflows

## 1. 收件匣歸檔流程
1. 使用者點擊側邊欄的 Inbox Item。
2. 系統在編輯區開啟該草稿。
3. 使用者完善內容後，選擇「指派專案」並填寫 Type/Status/Model。
4. 系統將資料從 Inbox (LowDB) 移除，並在目標專案資料夾建立 `.md` 檔案 (File System)。

## 2. 片語插入流程
1. 使用者在 Markdown 編輯區輸入文字。
2. 使用者瀏覽右側 Snippet Panel，或使用搜尋框過濾片語。
3. 使用者點擊某個片語。
4. 系統將 `snippet.content` 插入游標處。
5. 系統背景更新該 Snippet 的 `usage + 1` (寫入 LowDB)。

# Predefined Data (UI Mock)
* **預設專案**: "AI 工作流課程", "企業資金詢價平台".
* **預設片語**: "角色設定－資深系統分析顧問", "輸出格式－Markdown＋表格".