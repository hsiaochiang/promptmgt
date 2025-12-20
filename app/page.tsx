import TopBar from "./(workspace)/components/top-bar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <TopBar />
      <main className="flex-1 flex items-center justify-center border-t border-slate-200 bg-white/60 text-sm text-slate-500">
        即將開始：建立 Prompt Workspace 介面與 API，現為 Phase 1 腳手架。
      </main>
    </div>
  );
}
