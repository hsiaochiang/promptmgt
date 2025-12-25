# 002 UI Refresh — 規格（Checkpoint 4）

## 0. What / Why
- What：在 Next.js 14 App Router 下提供一組開發用 IA 頁面（/dashboard、/projects、/projects/[id]、/prompts、/prompts/[id]、/scratchpad），並以 mock 狀態呈現已驗收的 UI/互動規則；保留 `/` 既有工作區，不做替換。
- Why：
	- 讓設計/PM/開發能在真實瀏覽器跑通主要動線與 UI 狀態（loading/empty/error/success），並作為後續漸進導入的對照。
	- 提供可測試的行為合約（progress log 編輯、prompt 篩選/拷貝/移動、scratchpad save-as），避免後續 implement 隨意腦補。

## 1. 角色 / 使用情境
- PM / Designer：驗收 IA、互動規則與狀態表現。
- FE / BE 開發：依 spec 交付相同行為與路由，之後再掛接真實資料層。
- QA：依 Given/When/Then 驗收，並用 dev 狀態切換驗證 loading/empty/error。

## 2. IA / 路由（Next.js 14 App Router）
- `/dashboard`：總覽卡片 + 最新提示詞表格。
- `/projects`：專案列表（建立、標記進行中、歸檔）。
- `/projects/[id]`：專案詳情，含 progress log（預設唯讀、編輯/取消/儲存流程）與該專案提示詞列表。
- `/prompts`：提示詞列表（搜尋/篩選、複製、移動、歸檔）。
- `/prompts/[id]`：提示詞詳情（標題/正文/標籤/移動/複製/歸檔）。
- `/scratchpad`：草稿區（清空、複製、另存為提示詞）。
- 所有頁均以 `app/(app)/layout.tsx` 包 `MockAppProvider` + `AppShell`，並以 dev-only `DevStateToggle` 切換 loading/empty/error/success。

## 3. Top Flows（須可跑通，含狀態）
1) Progress log 編輯（/projects/[id]）
	 - 預設唯讀，顯示日期/summary/link（唯讀時 link 文案為「連結」）。
	 - 按「編輯」進入可編輯；輸入後可「儲存」或「取消」（取消需還原原值）。
	 - 「新增紀錄」後立即進入可編輯模式。
	 - 狀態：loading/empty/error/success 需可由 DevStateToggle 切換並顯示對應占位/提示。
2) Prompts list 搜尋/篩選 + 複製/移動/歸檔（/prompts）
	 - 搜尋在標題/正文/標籤上比對；未命中顯示空狀態。
	 - 篩選 status、project；歸檔需標記 archived。
	 - 複製須觸發 toast/snackbar；移動可改 projectId。
	 - 狀態：loading/empty/error/success 需可切換。
3) Prompt detail 編輯/標籤/移動/複製（/prompts/[id]）
	 - 可編輯標題/正文/標籤；移動改 projectId；複製觸發 toast；歸檔標記 archived。
	 - DevStateToggle 控制 loading/empty/error/success。
4) Scratchpad 另存為提示詞（/scratchpad）
	 - 文字可清空、複製（觸發 toast）、選取專案並「另存為提示詞」產生一筆新 prompt。
	 - DevStateToggle 控制 loading/empty/error/success（empty 時正文清空）。

## 4. UI 狀態（通用規則）
- loading：顯示「載入中…」類提示，隱藏主內容互動。
- empty：主要列表/正文清空並顯示空狀態文案；表格/列表為 0 筆。
- error：顯示錯誤文案（紅色），主互動停用。
- success：正常資料/互動。
- 切換由 DevStateToggle 完成，為 dev-only，不進入正式產品設定。

## 5. 互動規則（不可腦補）
- Progress log：唯讀→按「編輯」才可改；「取消」必須復原；唯讀顯示 link 文案「連結」。
- Prompt 列表：搜尋/篩選後無結果顯示空訊息；複製必出 toast；移動需更新 projectId；歸檔標記 archived。
- Prompt 詳情：標題/正文/標籤可編輯；移動專案、複製出 toast、歸檔標記 archived。
- Scratchpad：清空、複製出 toast、另存為提示詞會在選定專案下新增一筆。
- Toast：在 copy/save 等動作後顯示，並可關閉或自動消失。

## 6. 驗收條件（Given/When/Then）
- Flow 1（progress log）：
	- Given 進入 `/projects/[id]` success 狀態且有既有紀錄
	- When 點「編輯」、修改摘要後點「取消」
	- Then 紀錄恢復為原值，仍為唯讀；link 文案顯示「連結」
	- When 再次「編輯」→修改→「儲存」
	- Then 紀錄更新並維持唯讀顯示
- Flow 2（prompts 搜尋/篩選 + 複製）：
	- Given `/prompts` success 狀態
	- When 搜尋不存在關鍵字
	- Then 顯示空狀態文案
	- When 點任一提示詞「複製」
	- Then 出現 toast，內容提示已複製
- Flow 3（prompt detail 標籤/移動/複製）：
	- Given `/prompts/[id]` success 狀態
	- When 新增標籤並移除一個標籤
	- Then 標籤區更新；回列表應反映變更（同 mock 資料）
	- When 切換 project 下拉
	- Then prompt 的 projectId 更新
	- When 點「複製」
	- Then 出現 toast
- Flow 4（scratchpad 另存）：
	- Given `/scratchpad` success 狀態且草稿有文字
	- When 點「另存為提示詞」並選定專案
	- Then 該專案下新增一筆 prompt，並顯示成功 toast

## 7. Out of Scope
- 不串接真實 DB/檔案系統；全數使用 `MockAppProvider` 資料。
- 不替換 `/` 既有 workspace UI；不變更現有 API。
- Settings / ImportExport / ChangeReport 等非本次 IA 頁面。

## 8. Open Items
- 後續是否以 feature flag 將新 IA 植入 `/` 主體；待 PM/開發評估。
- 真實資料層映射：prompt/project schema 與現有 API 的欄位對齊計畫。
- 可視化/無障礙（A11y）細節尚未定義，實作時需補列。 
