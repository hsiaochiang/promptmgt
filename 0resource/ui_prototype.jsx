export default function PromptWorkspace() {
  const projects = [
    {
      id: "proj-1",
      name: "AI 工作流課程",
      status: "進行中",
      promptCount: 12,
      updatedAt: "2025-12-10",
    },
    {
      id: "proj-2",
      name: "企業資金詢價平台",
      status: "進行中",
      promptCount: 8,
      updatedAt: "2025-12-08",
    },
    {
      id: "proj-3",
      name: "貿易管理業務知識資料庫",
      status: "規劃中",
      promptCount: 5,
      updatedAt: "2025-12-05",
    },
  ];

  const inboxPrompts = [
    {
      id: "inbox-1",
      title: "TAIA 官網改版－需求釐清提示詞草稿",
      createdAt: "2025-12-09",
      hint: "尚未指定專案與標籤",
    },
    {
      id: "inbox-2",
      title: "RAG 教學簡報逐字稿生成 v1",
      createdAt: "2025-12-09",
      hint: "候選：AI 工作流課程 / 外部授課",
    },
  ];

  const prompts = [
    {
      id: "p-1",
      projectId: "proj-1",
      title: "課程簡報雛形生成提示詞 v3",
      type: "簡報生成",
      status: "使用中",
      model: "ChatGPT",
      tags: ["課程", "簡報", "教學"],
      updatedAt: "2025-12-09",
    },
    {
      id: "p-2",
      projectId: "proj-1",
      title: "n8n Level1 認證情境設計提示詞",
      type: "結構設計",
      status: "草稿",
      model: "ChatGPT",
      tags: ["n8n", "流程", "教學"],
      updatedAt: "2025-12-08",
    },
    {
      id: "p-3",
      projectId: "proj-1",
      title: "RAG 實作步驟說明提示詞",
      type: "RAG 調教",
      status: "使用中",
      model: "Gemini",
      tags: ["RAG", "教學", "技術文件"],
      updatedAt: "2025-12-07",
    },
  ];

  const snippets = [
    {
      id: "s-1",
      name: "角色設定－資深系統分析顧問",
      category: "角色設定",
      usage: 18,
      content:
        "你是一位資深系統分析與網站規劃顧問，熟悉跨部門專案協作與需求釐清。",
    },
    {
      id: "s-2",
      name: "輸出格式－Markdown＋表格",
      category: "輸出格式",
      usage: 24,
      content:
        "請以 Markdown 格式輸出結果，必要時使用表格彙整重點。",
    },
    {
      id: "s-3",
      name: "RAG 回答規則",
      category: "限制條件",
      usage: 15,
      content:
        "所有回答必須以向量資料庫中的內容為主，無相關資訊時請明確回答不知道。",
    },
  ];

  const selectedProjectId = "proj-1";
  const selectedPrompt = prompts[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
            PM
          </div>
          <div>
            <div className="font-semibold text-sm">Prompt Management Workspace</div>
            <div className="text-xs text-slate-500">
              專案導向的提示詞管理與整理工作台
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50">
            今日變更報告
          </button>
          <button className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800">
            新增提示詞
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Projects / Inbox */}
        <aside className="flex-shrink-0 basis-60 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold text-xs tracking-wide text-slate-600">
              專案與收件匣
            </div>
            <div className="flex gap-1 text-[10px] text-slate-400">
              <button className="px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-50">
                專案
              </button>
              <button className="px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-50">
                收件匣
              </button>
            </div>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500">專案列表</span>
                <button className="text-[11px] text-slate-400 hover:text-slate-600">
                  新增專案
                </button>
              </div>
              <div className="space-y-1.5">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    className={
                      "w-full text-left rounded-lg px-3 py-2 border text-xs flex flex-col gap-0.5 " +
                      (p.id === selectedProjectId
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{p.name}</span>
                      <span className="text-[10px] opacity-70">{p.promptCount} 篇</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] opacity-70">
                      <span>{p.status}</span>
                      <span>更新：{p.updatedAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inbox section */}
            <div className="pt-2 border-t border-slate-200 mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  未歸檔收件匣
                </span>
                <span className="text-[10px] text-amber-600 font-medium">
                  {inboxPrompts.length} 筆待整理
                </span>
              </div>
              <div className="space-y-1.5">
                {inboxPrompts.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-[11px] space-y-0.5"
                  >
                    <div className="font-semibold truncate">{i.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-amber-700">
                      <span>{i.hint}</span>
                      <span>建立：{i.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
        <div className="w-[3px] cursor-col-resize bg-slate-200/70" />

        {/* Middle column: prompt list & filters */}
        <main className="flex-[1.2] flex flex-col border-r border-slate-200">
          {/* Filters */}
          <div className="h-16 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 relative text-xs">
                <input
                  className="w-full rounded-full border border-slate-300 bg-white px-3 py-1.5 pr-8 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs"
                  placeholder="搜尋提示詞（標題、內容、標籤）"
                />
                <span className="absolute right-3 top-1.5 text-[10px] text-slate-400">
                  Ctrl + K
                </span>
              </div>
              <button className="text-[11px] px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100">
                篩選條件
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button className="px-2 py-1 rounded-full bg-slate-900 text-white">
                進行中
              </button>
              <button className="px-2 py-1 rounded-full border border-slate-300 bg-white">
                全部
              </button>
            </div>
          </div>

          {/* Prompt list */}
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <div>
                專案：
                <span className="font-semibold text-slate-800">
                  {
                    projects.find((p) => p.id === selectedProjectId)?.name ||
                    "—"
                  }
                </span>
              </div>
              <div className="flex gap-2">
                <span>共 {prompts.length} 篇提示詞</span>
              </div>
            </div>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className={
                    "w-full text-left rounded-lg border px-3 py-2 text-xs flex flex-col gap-1 hover:bg-slate-50 " +
                    (prompt.id === selectedPrompt.id
                      ? "border-slate-900 bg-slate-900/5"
                      : "border-slate-200")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">
                      {prompt.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      更新：{prompt.updatedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px]">
                        {prompt.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-slate-300 text-[10px]">
                        狀態：{prompt.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-slate-300 text-[10px]">
                        模型：{prompt.model}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {prompt.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        <div className="w-[3px] cursor-col-resize bg-slate-200/70" />

        {/* Right column: prompt editor + snippets */}
        <section className="flex-[1.8] flex flex-col">
          {/* Prompt meta + actions */}
          <div className="border-b border-slate-200 bg-white px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">目前編輯中</div>
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[260px]">
                  {selectedPrompt.title}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[10px]">
                <div className="flex gap-1">
                  <button className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100">
                    複製完整提示詞
                  </button>
                  <button className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100">
                    複製給模型用
                  </button>
                </div>
                <div className="flex gap-1 text-slate-400">
                  <span>Ctrl + C 完整</span>
                  <span>Alt + C 精簡</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="px-2 py-0.5 rounded-full bg-slate-100">
                狀態：{selectedPrompt.status}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100">
                模型：{selectedPrompt.model}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100">
                所屬專案：
                {projects.find((p) => p.id === selectedPrompt.projectId)?.name}
              </span>
            </div>
          </div>

          {/* Editor + snippet area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="h-8 px-3 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200 bg-slate-100">
                <span>提示詞內容（Markdown 編輯區）</span>
                <span>自動儲存 · 最後編輯時間：2025-12-09 22:18</span>
              </div>
              <div className="flex-1 overflow-auto p-3">
                <div className="w-full h-full rounded-lg bg-white border border-slate-200 p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                  {`# 角色設定
你是一位資深系統分析與網站規劃顧問，熟悉 AI 工作流、RAG 與 n8n，自行負責系統規劃與跨部門溝通。

# 任務目標
協助我根據課程大綱與既有範例，產生一份適合 6 小時實作課程使用的簡報雛形，並同時輸出講師備註稿。

# 輸入格式
我會提供：
1. 課程大綱
2. 既有簡報或講義片段（若有）
3. 特別注意事項（例如：不要使用大陸用語）

# 輸出要求
1. 以 Markdown 形式輸出簡報結構，每一頁為一個章節
2. 同時提供講師逐字稿建議，與每頁對應
3. 如有不確定處，請以「【待確認】」標註

# 回答語言
請使用繁體中文。`}
                </div>
              </div>
            </div>

            {/* Snippet / clipboard */}
            <div className="w-56 bg-white flex flex-col">
              <div className="h-8 px-3 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200">
                <span>常用片語剪貼簿</span>
                <button className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50">
                  管理
                </button>
              </div>
              <div className="p-2 border-b border-slate-100 text-[10px] flex items-center gap-1">
                <input
                  className="flex-1 rounded-full border border-slate-300 bg-white px-2 py-1 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="搜尋片語名稱或內容"
                />
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-2 text-[11px]">
                {snippets.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 hover:bg-slate-100 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate">{s.name}</span>
                      <span className="text-[9px] text-slate-400">
                        使用 {s.usage}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {s.content}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100">
                        {s.category}
                      </span>
                      <span>點擊插入到游標</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
