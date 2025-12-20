export default function TopBar() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
          PM
        </div>
        <div>
          <div className="font-semibold text-sm">Prompt Management Workspace</div>
          <div className="text-xs text-slate-500">專案導向的提示詞管理與整理工作台</div>
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
  );
}
