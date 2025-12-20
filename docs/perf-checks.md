# 性能檢查腳本（Phase 7 / T037a）

## SC-003/004：複製與搜尋延遲
1. 啟動：`npm run dev`，開啟 http://localhost:3000
2. 匯入測試資料：在 `Prompts/Perf/` 放入 200~500 篇含 frontmatter 的 Markdown。
3. 搜尋測試：
   - 在 Snippet/Prompt 搜尋輸入框輸入關鍵字。
   - 使用 DevTools Performance 量測從鍵入到結果渲染時間，期望 < 200ms（SC-004）。
4. 複製測試：
   - 在 PromptHeader 點「複製完整」與「複製精簡」。
   - 以 Performance/Profiler 觀察操作到剪貼簿 API 回傳時間，期望 < 150ms（SC-003）。

## SC-008：啟動時間 50/500 資料集
1. 準備資料集：
   - 50 篇：`Prompts/Perf50/`
   - 500 篇：`Prompts/Perf500/`
2. 啟動 `npm run dev`，開啟頁面後使用 Performance timeline 測量首屏完成時間。
3. 目標：50 篇 < 2s；500 篇 < 5s（含初次掃描與列表渲染）。

## SC-006：外部修改提示 ≤ 5s 通知
1. 啟動應用並載入任一提示詞。
2. 手動以檔案系統修改該 Markdown 檔（更新 mtime）。
3. 在 5 秒內確認 UI 觸發衝突/重新載入提示（由 conflict 檢查或重新掃描觸發）。
4. 若未觸發，檢查 `lib/services/conflict.ts` 與輪詢/掃描機制並調整頻率。

## 產出
- 以瀏覽器 Performance 記錄檔（.json/.har）與觀察結果備註於 PR。