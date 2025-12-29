# 原型對齊規格：提示詞工作台（UI/UX 以 prototype 為準）

**分支**：`001-local-prompt-manager`  
**日期**：2025-12-28  
**原型來源**：`0resource/prototype/`（`index.html` + `app.js` + `styles.css`）  

## 原型版本與差異說明（避免規格與實作打架）

本 repo 內的 `0resource/prototype/` 可視為「視覺語言 + IA 基線 + 互動手感」的權威來源；但現行實作（Workspace UI）已擴充部分 Topbar actions 與產品能力（例如設定、今日變更報告、片語顯示切換、Markdown 編輯/預覽等）。

為避免出現兩套互相矛盾的規格，本文件採以下規則：

- **Layout / 信息架構 / 命名語氣**：盡量以 `0resource/prototype/` 為準。
- **現行實作已交付且有測試覆蓋的功能**：即使 prototype 未呈現，也在本 spec 明確列為「實作擴充」，後續以此 spec 為準。

### 與 `0resource/prototype/` 的關鍵差異（已落地）

- **Topbar actions**：prototype 的 top-actions 只顯示「操作指引 / 新增提示詞」；現行 Workspace 另外提供「開啟/隱藏片語、設定、今日變更報告」。
- **片語庫**：prototype 未包含片語庫；現行 Workspace 右側提供片語面板並可插入內容，且可由 Topbar 及側欄切換顯示。
- **Prompt Detail 能力**：prototype 以簡化 textarea 為主；現行 Workspace 支援 Markdown 編輯/預覽、autosave、衝突處理與複製模式等（見下方 Prompt Detail）。

## 核心原則（很重要）

- **前端操作/資訊架構/互動回饋**：以 `0resource/prototype/` 的實際畫面與互動為準。
- **檔案系統、rootPath、Frontmatter（非 UI/UX）**：仍以現有系統已實作為準（Markdown 檔 + YAML frontmatter、rootPath 設定頁、衝突偵測等）。

本文件的目標是「收斂 spec 使其與 prototype 一致」，同時不推翻既有資料層能力。

## Clarifications（補充釐清 / 需求鎖定）

### Session 2025-12-27

- Q: 自動儲存間隔多久執行一次？ → A: 2 秒（草稿與提示詞同頻率），無輸入時暫停計時，恢復輸入再計時
- Q: 如何設定或修改根路徑？ → A: 透過設定頁輸入並儲存 rootPath，缺路徑時在 RootPathAlert 提供導向連結
- Q: 是否要求所有實體必備 createdAt/updatedAt 且以 UTC+08:00 ISO 儲存並自動補值？ → A: 是，所有實體（Project/Prompt/Inbox/Snippet/Settings）都須具備 createdAt/updatedAt，格式為 ISO 8601（UTC+08:00），缺值由系統自動填入。
- Q: Prompt Detail 的 Markdown 預覽呈現方式？ → A: Main 區塊以「編輯 / 預覽」Tabs 互斥切換
- Q: 刪除 + Undo 的落地規則？ → A: 5 秒內採軟刪可完整復原；逾時才永久刪除
- Q: createdAt/updatedAt 更新規則（含 autosave）？ → A: createdAt 僅首次建立自動填入；每次成功儲存（含 autosave）都更新 updatedAt
- Q: RootPathAlert 何時觸發？ → A: rootPath 缺失/不可存取時採全站級提示（不阻擋瀏覽），並提供導向設定頁
- Q: 自動儲存遇到寫入衝突（例如 409 / 檔案被外部修改）時如何處理？ → A: 顯示衝突提示，提供「重新載入 / 另存副本 / 強制覆寫」三選一

### Session 2025-12-28

- Q: Projects（專案列表）要不要真的對齊 prototype 的資料欄位（summary/projectType/tags）？ → A: 是，完整對齊：Project 實體新增 summary/projectType/tags，API/儲存/測試一起升級
- Q: Prompts（提示詞列表）的篩選器要以哪一套為準？ → A: 以 prototype 為準：分類（category）+ 階段（stage）+ 平台（platform）+ 標籤（tag）
- Q: Project 的 summary（專案摘要）欄位來源要怎麼定義？ → A: 混合：預設由 README 推導，但允許使用者覆寫並保存 summary
- Q: taxonomy 欄位（Project projectType、Prompt category/promptStage/platformTags/...）在 API/儲存時要以什麼作為權威？ → A: 同時存 code 與 name（雙寫入），並保證一致性（不一致視為錯誤）
- Q: Project 的 status 要不要改成 prototype 的狀態枚舉？ → A: 是，改為 prototype：ACTIVE/PAUSED/ARCHIVED（以 TaxonomyValue 存 code+name）

## 已對齊原型：變更點（相較於原先 spec 的主要收斂/修正）

- 已對齊原型：以 Topbar Tabs 導覽為主（專案/提示詞/剪貼簿），固定兩欄 Shell（Main + Side）。
- 已對齊原型：刪除型操作採兩段式：Confirm Modal → Snackbar Undo（5 秒倒數）。
- 已對齊原型：Projects / Project Detail / Prompts / Prompt Detail / Scratchpad 五個頁面規格，以原型互動為準。
- 已對齊原型：片語庫以 Side Panel 常駐區塊呈現，並可由 Topbar「隱藏片語」切換顯示/隱藏（不使用 Drawer）。
- 已對齊原型：不新增原型未定義的 UI 模式（例如三欄拖曳寬度、全域搜尋等）。
- 已對齊原型：不以原型決定資料持久化方式；檔案系統/rootPath/frontmatter 仍以現有系統為準。
- 已對齊原型：在 Prompt Detail 的版面/互動保持原型一致，但補入必要能力：Markdown 編輯＋預覽、完整/精簡複製、自動儲存。

## 資訊架構（IA）

原型採固定 Shell：`Main Panel`（主要內容）+ `Side Panel`（輔助資訊/標籤/快速操作）。頂部含：

- Tabs：專案（Projects）/ 提示詞（Prompts）/ 剪貼簿（Scratchpad）
- Top actions（實作擴充，prototype 僅有部分）：操作指引（Help）/ 開啟/隱藏片語（Toggle，影響右側片語庫區塊）/ 設定 / 今日變更報告 / 新增提示詞

## User Stories（對照頁面 / 方便拆 tasks）

> 本 spec 主要以「原型五頁面」描述；下列 User Stories 僅用於讓 `tasks.md` 的 US 編號有可追溯來源。

- **US1（P1）Workspace Shell + Topbar Tabs**：使用者可在 Projects / Prompts / Scratchpad 三個 Tabs 間切換；Main/Side 區塊隨 Tab 切換；rootPath 缺失/不可存取時顯示全站提示但不阻擋瀏覽。
- **US2（P1）Projects + Project Detail + README**：使用者可瀏覽/切換專案並進入 Project Detail；可編輯與儲存專案 README.md（專案說明檔）。
- **US3（P1）Prompts（列表）**：使用者可在 Prompts 列表瀏覽提示詞並進入 Prompt Detail。
- **US4（P1）Prompt Detail（編輯/預覽 + autosave + 複製 + 409 三選一）**：使用者可在 Prompt Detail 編輯與預覽 Markdown；停止輸入 2 秒自動儲存；支援精簡/完整複製；遇到 409 衝突提供三選一（重新載入 / 另存副本 / 強制覆寫）。
- **US5（P1）Scratchpad（剪貼簿）**：使用者可快速新增內容並加入剪貼簿列表、複製內容；Side 顯示操作與列表數量（count）。
- **US6（P1）刪除 + Undo（5 秒 deferred delete）**：刪除操作需 Confirm；刪除後 5 秒內可 Undo 並完整復原；逾時才永久刪除（套用到 Project/Prompt/Scratchpad）。

## 全域互動元件（跨頁一致）

- Toast：短提示（約 2.4 秒自動消失）
- Confirm Modal：危險操作二段式確認（取消/刪除）
- Snackbar Undo：刪除後 5 秒可復原（復原/關閉）；5 秒內採軟刪以支援完整復原，逾時才永久刪除

## 無障礙（a11y）最小驗收（對齊 WCAG 2.1 AA）

- Tabs 導覽需支援鍵盤操作：Tab 可聚焦、左右方向鍵切換、Enter/Space 啟用；並具備正確的 ARIA role（tablist/tab/tabpanel）與 aria-selected 狀態。
- Confirm Modal 開啟後需 focus trap；Esc 可關閉；關閉後焦點回到觸發按鈕。
- Snackbar Undo 需可被鍵盤聚焦並可操作（Undo/Close）；倒數期間不應阻斷其他互動。
- RootPathAlert 的導向連結需有可理解的文字（非僅圖示），並可用鍵盤觸發。
- 錯誤訊息需「可操作」且可被輔助工具讀取（不要只靠顏色區分）。

## 頁面規格（以原型為準）

### 1) Projects（專案列表）

- Main：專案卡片列表（以 prototype 的資訊密度呈現）+ 篩選（搜尋 + 狀態 + 分類 projectType + 標籤 tag）+「新增專案」
- 專案卡片需顯示：專案名稱、摘要（summary）、狀態（badge）、分類 projectType（badge）、共通標籤 tags（chips）、提示詞數（promptCount）、更新時間（updatedAt）
- Side：專案概覽 KPI（進行中/暫停/封存）+ 使用建議（CTA：新增提示詞）
- 行為：點擊專案卡片 → 進入 Project Detail

### 2) Project Detail（專案詳情）

- Main：專案摘要、專案 README（編輯/預覽/儲存）、該專案提示詞清單、檔案列表（上傳/描述/刪除）、進度紀錄（新增/刪除）
- Side：
	- 分類與標籤（持久化以專案資料夾的 `_meta.json` 為主；並確保 Projects API 會彙整回傳 `projectType/tags` 供列表卡片呈現）
		- 平台標籤/交付物標籤/受眾標籤/共通標籤：輸入框 + Enter 新增，chips 可移除，提供清空
		- taxonomy 欄位採 `code+name` 雙寫入；server 需驗證一致性，不一致視為錯誤
	- 專案資訊（狀態等）
	- 危險操作（刪除專案）
- 行為：刪除類操作均需 Confirm，刪除後顯示 Snackbar Undo（5 秒）；5 秒內可復原，逾時永久刪除

### 3) Prompts（提示詞列表）

- Main：跨專案提示詞列表 + 篩選（搜尋 + 分類 category + 階段 stage + 平台 platform + 標籤 tag；對齊 prototype）
- 列表列資訊需包含：標題、（專案名稱 · 分類名稱 · 階段名稱）、更新時間、狀態（badge）
- Side：
	- 提示詞概覽 KPI
	- 常用片語庫（可新增/編輯/插入/刪除；顯示 usage 次數與最後使用）
	- Topbar「隱藏片語」可隱藏此區塊以讓版面更專注
- 行為：點擊提示詞列 → 進入 Prompt Detail

### 4) Prompt Detail（提示詞編輯）

原型版面與 Side Panel 欄位配置為主；並補入現有系統必要能力：

- **Markdown 編輯與預覽**：提供編輯器與預覽，支援語法高亮與常用區塊（程式碼、列表、標題）；預覽呈現以 Main 區塊「編輯 / 預覽」Tabs 互斥切換。
- **自動儲存（2 秒）**：輸入後 2 秒觸發存檔；無輸入時不重複觸發；恢復輸入後重新計時。
	- 衝突處理：若偵測到寫入衝突（例如 409 或檔案被外部修改），需提示使用者並提供「重新載入 / 另存副本 / 強制覆寫」三選一。
- **複製模式**：
	- 精簡複製：只複製內容本體（去除 YAML frontmatter）並顯示已複製提示。
	- 完整複製：複製 frontmatter + 本體。

### 5) Scratchpad（剪貼簿）

- Main：剪貼簿列表 +「快速新增」輸入框（清空輸入 / 加入列表）+ 每筆可直接複製
- Side：剪貼簿操作（複製內容 / 快速新增）+ 列表數量（count）
- 持久化：以 client 端（localStorage）保存剪貼簿列表；不依賴 rootPath

### 6) Settings（設定）

- Main：rootPath/logPath 與功能開關（遙測、更新檢查等）
- 本次範圍說明：Settings 以「rootPath 缺失/不可存取導引」為主要對齊點；logPath/遙測/更新檢查沿用既有能力，本次不新增/改動 UI 或 API 契約。
- rootPath：必填且需可存取；缺失/不可存取時 RootPathAlert 以全站提示導向 Settings
- logPath：必須位於「使用者目錄」或「rootPath」底下
	- UI 提供快捷：使用預設（DEFAULT_ROOT/logs/app.log）、使用 rootPath（rootPath/logs/app.log）
	- 伺服端錯誤需回傳可操作 details（field + userDir/rootPath/examples）

### 7) 今日變更報告（Change Report）

- 提供快速檢視最近 24 小時內的變更（提示詞/收件匣/專案等），從 Topbar 進入
- 若無資料顯示空狀態；載入/錯誤需有明確回饋
- 本次範圍說明：今日變更報告屬既有擴充能力說明，本次不新增/改動其 UI 或 API；若需擴充，另立獨立 feature 與 tasks。

## 非 UI/UX 的資料層與格式（以現有系統已實作為準）

**TaxonomyValue（規格型別）**

本 spec 中提到的 taxonomy 欄位（例如 projectType、category、promptStage、platformTags 等）採用以下型別：

```ts
type TaxonomyValue = { code: string; name: string };
```

**規則（非選配）**

- API 與持久化需雙寫入 `code` + `name`。
- server 必須驗證 `code` 對應的 `name` 是否正確（以系統內建 taxonomy 表為準）。
- 若 `code`/`name` 不一致：回傳 400（validation error），不得靜默修正。

**Project 欄位（對齊 prototype）**

Project 實體需具備並可由 API 回傳以下欄位，以支援 Projects（專案列表）的 prototype 呈現：

| key | type | required | notes |
|-----|------|----------|-------|
| status | TaxonomyValue | Y | 對齊 prototype taxonomy.projectStatuses（允許值：`ACTIVE/PAUSED/ARCHIVED` 對應中文 `進行中/暫停/封存`） |
| summary | string | Y | 專案摘要（用於列表卡片第二行）；預設可由 README 第一段/前 N 字推導產生，但允許使用者覆寫並持久化保存（覆寫後以保存值為準）；長度建議 ≤ 200 |
| projectType | TaxonomyValue | Y | 專案分類（對齊 prototype taxonomy.projectTypes） |
| tags | TaxonomyValue[] | Y | 共通標籤清單（對齊 prototype taxonomy.commonTags；用於列表 chips；需去重） |

### rootPath 設定與路徑失效導引

- 使用者可在設定頁輸入並儲存 rootPath。
- 當 rootPath 缺失或無法存取時，RootPathAlert 採全站級提示（不阻擋瀏覽），並提供導向設定頁的行動入口。

### 正式提示詞儲存格式（Markdown + YAML frontmatter）

- 正式提示詞以 Markdown 檔案儲存於專案資料夾。
- 檔案包含 YAML frontmatter + 內容本體。
- Frontmatter 至少包含：標題、專案、類型、狀態、模型、標籤、`updatedAt`（最後更新時間）、備註（`note`）。

#### Prompt Frontmatter 欄位表（規格即契約）

> 本 spec 中「最後更新時間」一律指 `updatedAt`（ISO 8601，UTC+08:00）。

| key | type | required | default | notes |
|-----|------|----------|---------|-------|
| title | string | Y | `"untitled"`（補值） | 不可空白；做為顯示標題 |
| project | string | Y | `"unspecified"`（補值） | 不可空白；用於歸屬專案（顯示用專案名） |
| type | string | Y | `"其他"` | 長度 ≤100；目前不限制枚舉值 |
| status | string | Y | `"草稿"` | 允許值：`draft/active/archived` 或 `草稿/使用中/已封存`（允許英中並行） |
| category | TaxonomyValue | Y | 對齊 prototype taxonomy.conversationCategories |
| promptStage | TaxonomyValue | Y | 對齊 prototype taxonomy.promptStages |
| model | string | N | `""`（可省略） | 長度 ≤100 |
| platformTags | TaxonomyValue[] | Y | `[]` | 對齊 prototype taxonomy.platformTags；需去重 |
| audienceTags | TaxonomyValue[] | Y | `[]` | 對齊 prototype taxonomy.audienceTags；需去重 |
| deliverableTags | TaxonomyValue[] | Y | `[]` | 對齊 prototype taxonomy.deliverableTags；需去重 |
| tags | TaxonomyValue[] | Y | `[]` | 對齊 prototype taxonomy.commonTags；需去重 |
| note | string | N | （省略） | 長度 ≤2000；歷史相容 `notes` → 正規化為 `note` |
| createdAt | string | Y | server/資料層補值 | ISO 8601 (UTC+08:00)；僅首次建立設定 |
| updatedAt | string | Y | server/資料層補值 | ISO 8601 (UTC+08:00)；每次成功儲存（含 autosave）都由 server/資料層更新並回傳 |

**規則（非選配）**

- client 不得自行宣告 `updatedAt` 作為權威；UI 顯示以 server 回傳值為準。
- 若 frontmatter 缺必要欄位：必須「補值」或回傳「可操作錯誤」阻擋靜默寫入（不得默默產生不完整檔）。

### 衝突偵測與解決（寫入衝突 / 409）

- 當偵測到寫入衝突（例如檔案被外部修改導致 409），系統需阻止靜默覆蓋並提示使用者採取行動。
- 必須提供三個處理選項：重新載入 / 另存副本 / 強制覆寫。

### 專案說明檔（README.md）

- 每個專案需建立並維護專案說明 Markdown 檔，記錄專案資訊與進度，存放於專案資料夾且可由使用者編輯。

### 時間欄位規範（UTC+08:00 ISO 8601）

- 所有實體（Project/Prompt/Inbox/Snippet/Settings）必須有 createdAt/updatedAt。
- 格式為 ISO 8601（UTC+08:00），缺值由系統自動補值。
- createdAt 僅在首次建立時填入；每次成功儲存（包含 autosave）都更新 updatedAt。

## 驗收情境（聚焦本次對齊點）

1. **Given** 使用者編輯提示詞內容，**When** 停止輸入 2 秒，**Then** 自動儲存觸發；無輸入期間不重複觸發
2. **Given** 提示詞含 Frontmatter，**When** 使用者點「精簡複製」，**Then** 只複製內容本體（無 YAML/標題/標籤），並顯示已複製提示
3. **Given** 提示詞含元數據，**When** 使用者點「完整複製」，**Then** 將 Frontmatter + 本體複製到剪貼簿
4. **Given** 使用者刪除專案/提示詞/剪貼簿項目，**When** 確認刪除，**Then** 顯示 Snackbar Undo（5 秒）且可在時限內復原；逾時則永久刪除
5. **Given** 使用者編輯提示詞且該檔案被外部修改，**When** autosave 觸發並偵測寫入衝突（409），**Then** 顯示衝突提示並提供「重新載入 / 另存副本 / 強制覆寫」三選一

## 非功能需求（NFR）

- **效能**：互動 API p95 < 200ms（本機、非大量資料）；列表/搜尋結果上限 1000，超出需截斷或提示收斂。
- **量測與紀錄**：針對互動路徑（列表載入、Prompt Detail 讀取/寫入、autosave）建立可重複量測步驟並記錄 p95；若未達標需在同一變更集中附上原因與改善計畫，避免回歸。

## Testing / Quality Gates（依 Constitution，非選配）

- 本功能的所有變更必須遵循專案 Constitution 的 **Testing Standards (NON-NEGOTIABLE)**：測試需先寫、先失敗、再實作使其通過（Red-Green-Refactor）。
- 所有 public API（Route Handlers）需具備契約測試，並涵蓋成功回應、錯誤格式與衝突情境（含 409）。
- 覆蓋率門檻：單元測試至少 80%；關鍵路徑（autosave、409 衝突三選一、deferred delete/undo）需 100%。

## Functional Requirements（收斂後）

- **FR-002**: 系統必須在使用者輸入過程自動保存草稿與提示詞（間隔 2 秒，無輸入時暫停，恢復輸入後重新計時），並顯示最後保存時間；若偵測到寫入衝突（例如 409），必須提示並提供「重新載入 / 另存副本 / 強制覆寫」三選一
- **FR-005**: 系統必須將正式提示詞以 Markdown 檔案儲存於專案資料夾，包含 YAML Frontmatter 與內容本體
	- 驗收補充：提示詞檔案必須維持「Markdown + YAML frontmatter」格式；不得靜默寫出不含 frontmatter 的檔案。
- **FR-006**: 系統必須在 Frontmatter 中保存至少：標題、專案、類型、狀態、模型、標籤、`updatedAt`（最後更新時間）、備註
	- 註：本 spec 的「最後更新時間」指 `updatedAt`；「備註」欄位 key 為 `note`（歷史相容 `notes`）。
	- 驗收補充：若 frontmatter 缺必要欄位，需由系統補值或以可操作錯誤提示阻擋靜默寫入（不得默默產生不完整檔）。
- **FR-008**: 系統必須提供 Markdown 編輯器與預覽，支援語法高亮與多種區塊（程式碼、列表、標題）
- **FR-009**: 系統必須提供兩種複製模式：完整複製（含 Frontmatter）與精簡複製（僅內容本體，排除元數據）
- **FR-022**: 系統必須在設定頁提供 rootPath 輸入與儲存，RootPathAlert 需導向設定頁以補齊路徑
	- 驗收補充：設定頁需可輸入/儲存 rootPath；若路徑不可存取需顯示可操作錯誤訊息（含建議修復方式）。rootPath 缺失/不可存取時 RootPathAlert 顯示但不阻擋瀏覽，且提供導向設定頁入口。
- **FR-033**: 系統必須為每個專案建立並維護專案說明 Markdown 檔，記錄專案資訊與進度，存放於專案資料夾且可由使用者編輯
- **FR-035**: 系統必須確保所有實體（Project/Prompt/Inbox/Snippet/Settings）在建立與更新時自動補齊 createdAt 與 updatedAt，格式為 ISO 8601（UTC+08:00）；若輸入缺值由系統填入
	- 驗收補充：createdAt 僅首次建立；updatedAt 每次成功儲存（含 autosave）更新，且以 server/資料層為準。
