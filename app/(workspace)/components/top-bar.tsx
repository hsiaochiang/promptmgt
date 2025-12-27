import React from "react";
import Link from "next/link";
import clsx from "clsx";
import type { WorkspaceTab } from "../store/useWorkspaceStore";

interface Props {
  onShowChangeReport?: () => void;
  onCreatePrompt: () => void;
  creating?: boolean;
  onToggleSnippetPanel: () => void;
  snippetOpen: boolean;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}

const tabs: { key: WorkspaceTab; label: string }[] = [
  { key: "projects", label: "專案" },
  { key: "prompts", label: "提示詞" },
  { key: "scratchpad", label: "剪貼簿" }
];

export default function TopBar({
  onShowChangeReport,
  onCreatePrompt,
  creating,
  onToggleSnippetPanel,
  snippetOpen,
  activeTab,
  onTabChange
}: Props) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
            PM
          </div>
          <div>
            <div className="font-semibold text-sm">Prompt Management Workspace</div>
            <div className="text-xs text-slate-500">專案導向的提示詞管理與整理工作台</div>
          </div>
        </div>
        <nav className="flex items-center gap-2" role="tablist" aria-label="Workspace Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              data-testid={`workspace-tab-${tab.key}`}
              onClick={() => onTabChange(tab.key)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                activeTab === tab.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={onToggleSnippetPanel}
          className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
          data-testid="snippet-toggle"
        >
          {snippetOpen ? "隱藏片語" : "開啟片語"}
        </button>
        <Link href="/settings" className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50">
          設定
        </Link>
        <button
          onClick={() => {
            onShowChangeReport?.();
          }}
          className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
        >
          今日變更報告
        </button>
        <button
          onClick={onCreatePrompt}
          disabled={creating}
          className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {creating ? "建立中…" : "新增提示詞"}
        </button>
      </div>
    </header>
  );
}
