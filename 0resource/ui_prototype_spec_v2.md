# 提示詞管理系統｜Canvas 雛形專用規格模板（適用 ChatGPT Canvas React 原型）

> 目的：用「單一 React 檔」做出可點、可展示的互動雛形，完成「動線、功能、版面配置」的確認，並輸出可直接銜接 Coding 階段的規格（Flow / UI / Data Contract）。

---

## 0. 基本資訊（必填）
- 專案名稱：提示詞管理系統
- 雛形版本：v0.__
- 建立日期：YYYY-MM-DD
- 目標受眾：內部（自己）／主管審閱／協作開發（AI Coding）
- 雛形範圍：□ MVP（核心動線） □ Beta（含進階功能）
- 不在本次雛形範圍（明確列出）：
  - 例如：真實登入/SSO、後端 API、權限審計、全文檢索效能、資料加密、Git/CI 等

---

## 1. 雛形完成定義（Definition of Done for Prototype）
> 只要達成以下三類契約，即可視為雛形完成並進入 Coding。

### 1.1 Layout Contract（版面契約）
- 每個主要頁面完成：頁首/導覽/主內容區/次欄位（如右側詳情）布局
- 主要元件型態已定：列表、表單、分頁/篩選、對話框、Toast/提示
- 桌機版不破版（RWD 可延後）

### 1.2 Flow Contract（動線契約）
- 至少跑通 3 條主動線：
  1) 新增提示詞 → 儲存 → 回到列表
  2) 查詢/篩選 → 開啟詳情 → 編輯 → 儲存
  3) 專案/標籤歸檔流程（移動/分類）
- 每條動線包含狀態：Loading / Empty / Error / Success

### 1.3 Data Contract（資料契約）
- 列出每頁使用的資料結構（mock JSON）
- 列出核心操作的 request/response shape（即使尚未串接）

---

## 2. 使用者與角色（Role Model）
> 雛形可用「角色切換器」展示 UI 差異。
- 角色：
  - R1：個人使用者（Owner）
  - R2：協作者（Contributor）【可選】
  - R3：唯讀檢視者（Viewer）【可選】
- 權限矩陣（簡表）：
  | 功能 | Owner | Contributor | Viewer |
  |---|---:|---:|---:|
  | 建立/編輯提示詞 | Y | Y | N |
  | 變更專案設定 | Y | N | N |
  | 標籤/歸檔 | Y | Y | N |
  | 匯出 | Y | Y | Y |

---

## 3. 導覽與資訊架構（IA / Sitemap）
> Canvas 原型建議做「左側導覽 + 右側主內容」，以單檔切換頁面。

### 3.1 全站導覽
- Dashboard（概覽）
- 專案 Projects
- 提示詞 Prompts（可依專案篩選）
- 剪貼簿 Scratchpad / Clipboard
- 匯入/匯出 Import/Export
- 設定 Settings

### 3.2 URL/Route（雛形用，不要求真 Router）
- /dashboard
- /projects
- /projects/:id
- /prompts
- /prompts/:id
- /scratchpad
- /settings

---

## 4. 核心資料模型（Core Entities）
> 雛形必須先定欄位，Coding 才能穩定拆模組。

### 4.1 Project
- id
- name
- description
- createdAt
- updatedAt
- status（active/archived）
- progressLog（進度紀錄：可多筆，含 date、summary、link、editable flag）

### 4.2 Prompt
- id
- projectId
- title
- language（zh/en/mixed）
- content（markdown/text）
- tags（string[]）
- status（draft/active/archived）
- sourceLinks（對話連結/文件連結：在你既有決議中可能改為上傳/附件，依你規則）
- attachments（可選：檔名/類型/大小/placeholder）
- createdAt / updatedAt

### 4.3 Tag
- id
- name
- color（雛形可用 token，如 blue/green，不需真色票）

---

## 5. 頁面規格（Page Specs）
> 每頁一段：目的、主要元件、互動、狀態、按鈕說明。

### 5.1 Dashboard（概覽）
- 目的：快速掌握未歸檔提示詞、近期更新、專案進度
- 元件：
  - KPI 卡：未歸檔、草稿、已歸檔
  - Recent：最近更新提示詞列表（5 筆）
  - Quick Actions：新增提示詞／新增專案／開啟剪貼簿
- 狀態：空資料／載入／錯誤

**按鈕說明**
- 新增提示詞：開啟「提示詞編輯器（新建模式）」
- 新增專案：開啟「專案建立對話框」
- 開啟剪貼簿：導到 Scratchpad

---

### 5.2 Projects（專案列表）
- 目的：管理專案、快速進入專案工作區
- 元件：
  - Search（依名稱）
  - Filter：狀態 active/archived
  - 專案表格：name / updatedAt / status / actions
  - 右側（可選）：選中專案摘要

**互動**
- 點擊專案列：進入 Project Detail
- 專案 actions：編輯、封存、刪除（刪除雛形可僅確認框）

**按鈕說明**
- 新增專案：建立新專案
- 封存：專案狀態改 archived，仍可查詢

---

### 5.3 Project Detail（專案詳情 + 專案說明頁）
> 你的既有決議：專案要有說明頁、進度紀錄（預設不可編輯、點擊後才可編輯）、連結欄位非編輯狀態只顯示「連結」。

- 區塊 A：專案基本資訊（name/description/status/日期欄位）
- 區塊 B：進度紀錄（Progress Log）
  - 列表欄位：date / summary / link（顯示「連結」）/ edit
  - 行為：
    - 預設唯讀
    - 點「編輯」進入可編輯狀態
    - 取消：回復唯讀且不儲存
- 區塊 C：此專案提示詞清單（嵌入 Prompts List 的子集）
- 區塊 D：檔案上傳（若你已改規則：新增功能上傳、移除對話/文件連結）

**按鈕說明**
- 新增進度：新增一筆進度（預設唯讀，建立後可編輯）
- 編輯進度：切換該筆為 editable
- 取消編輯：復原變更
- 儲存：寫回 mock store
- 上傳檔案：新增附件 placeholder（不做真上傳）

---

### 5.4 Prompts（提示詞列表）
- 目的：查找、分類、快速複製與歸檔
- 元件：
  - Search：title/content
  - Filters：project / tags / status
  - Table/List：title / project / tags / updatedAt / status / actions
  - 批次操作：
    - 批次加標籤
    - 批次移到專案
    - 批次封存

**互動**
- 點擊列 → Prompt Detail
- Action：複製、編輯、封存、移動

**按鈕說明**
- 複製：將 content 複製到剪貼簿（雛形可用 toast 表示成功）
- 批次加標籤：開啟 Tag Picker 對話框

---

### 5.5 Prompt Detail（提示詞檢視/編輯）
- 目的：閱讀、編輯、版本概念（雛形用簡化）
- 元件：
  - Header：title + status + primary actions
  - 左側：Prompt metadata（project/tags/language/updatedAt）
  - 右側：內容編輯器（textarea / markdown preview toggle）
  - 下方：變更紀錄（可選：僅顯示最後更新人/時間）

**互動**
- View / Edit 切換
- Save / Cancel
- Copy

**按鈕說明**
- 儲存：更新 updatedAt、狀態可能從 draft → active
- 取消：回到前一版（雛形以 mock revert）

---

### 5.6 Scratchpad（剪貼簿）
- 目的：臨時寫、隨手貼、再整理到提示詞或專案
- 元件：
  - 大型輸入框（textarea）
  - Quick actions：
    - 存成提示詞（選專案、標題、標籤）
    - 清空
    - 複製

**按鈕說明**
- 存成提示詞：開啟「建立提示詞」對話框，內容帶入

---

### 5.7 Import/Export（匯入/匯出）【可選】
- 目的：與 markdown 檔案工作流銜接
- 雛形行為：
  - 匯出：下載 JSON（或顯示 export preview）
  - 匯入：貼上 JSON/Markdown，解析成 mock data

---

### 5.8 Settings（設定）【可選】
- 目的：偏好設定、命名規則、資料存放策略（雛形呈現即可）

---

## 6. UI 組件清單（Component Inventory）
> 這是 Coding 前最重要的拆解清單。
- AppShell（Sidebar + Topbar + Content）
- PageHeader（Title + Actions）
- DataTable（Search/Filter/Sort/Row actions）
- PromptEditor（Textarea + Preview toggle）
- TagPicker（Multi select）
- Dialog（Confirm / Form）
- Toast（Success/Error）
- EmptyState / LoadingState / ErrorState

---

## 7. 互動狀態（State Catalogue）
> 雛形必須能切換展示。
- 全域：
  - role = Owner/Contributor/Viewer
  - data = normal/empty
  - network = loading/error/success（用 toggle 模擬）
- 頁面：
  - 列表：搜尋無結果
  - 編輯：dirty state（未儲存提示）
  - 對話框：確認刪除/封存

---

## 8. Data Contract（Mock JSON 範本）
> 建議直接放在 React 檔底部，Coding 階段可搬到 fixtures。

### 8.1 Project Example
```json
{
  "id": "proj_001",
  "name": "HR Training Automation",
  "description": "內部訓練流程提示詞整理",
  "status": "active",
  "createdAt": "2025-12-01",
  "updatedAt": "2025-12-20",
  "progressLog": [
    {"date": "2025-12-18", "summary": "完成 IA 與頁面草稿", "link": "https://...", "editable": false}
  ]
}
```

### 8.2 Prompt Example
```json
{
  "id": "prm_001",
  "projectId": "proj_001",
  "title": "會議逐字稿整理提示詞",
  "language": "zh",
  "content": "# 目標\n將逐字稿彙整成...",
  "tags": ["meeting", "summary"],
  "status": "active",
  "attachments": [{"name": "notes.md", "type": "text/markdown", "size": 10240}],
  "createdAt": "2025-12-10",
  "updatedAt": "2025-12-20"
}
```

---

## 9. 事件與操作清單（Action List）
> 雛形要能用「按鈕說明」對應這些事件。
- Project
  - createProject
  - updateProject
  - archiveProject
  - addProgressLog / editProgressLog / cancelProgressLogEdit
- Prompt
  - createPrompt
  - updatePrompt
  - archivePrompt
  - movePromptToProject
  - addTags / removeTags
  - copyPromptContent
- Scratchpad
  - saveScratchpadAsPrompt
  - clearScratchpad
  - copyScratchpad

---

## 10. 原型檔案內建工具（Prototype Controls）
> 建議在右上角放一排 toggle。
- Role switcher：Owner/Contributor/Viewer
- Network switcher：success/loading/error
- Data switcher：normal/empty
- Theme switcher（可選）：light/dark

---

## 11. 交付物（Prototype Deliverables）
- D1：Canvas React 單檔原型（可點、可切頁、可展示狀態）
- D2：本規格模板填寫版（含 IA / Page Specs / Data Contract）
- D3：AI Coding Hand-off（建議另存一份）
  - 要拆哪些 components
  - 路由與資料層設計建議
  - 待確認議題清單（Open Items）

---

## 12. Open Items（待確認）
> 雛形階段就標記，避免進入 Coding 才爆。
- 儲存格式：Markdown 檔的命名規則、路徑規則
- 版本控管：以 Git 為主？是否要在 UI 顯示版本歷史？
- 檔案上傳：僅本地引用？或要轉成附件管理？
- 搜尋：需要全文檢索（content）或僅標題/標籤？

---

## 13. AI Coding 交接摘要（1 頁）
> 填完本段，就能直接丟給 Codex/ Copilot 做工程化。
- Pages：
  - Dashboard, Projects, ProjectDetail, Prompts, PromptDetail, Scratchpad
- Components：
  - AppShell, DataTable, PromptEditor, TagPicker, Dialog, Toast
- State：
  - global role/network/data + editor dirty state
- Data：
  - Project/Prompt/Tag 的型別與範例 JSON
- 非本次：
  - 真 API、SSO、真上傳、CI/CD、測試

