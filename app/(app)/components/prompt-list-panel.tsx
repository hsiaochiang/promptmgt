"use client";

import React, { useMemo, useState } from "react";
import { applyPromptFilters } from "../../../lib/ui/promptFilters";
import { Prompt, Project } from "../providers/mock-app";
import { DevStateToggle, ViewState } from "./dev-state-toggle";

export function PromptListPanel({
  prompts,
  projects,
  viewState,
  onViewStateChange,
  onSelect,
  onCopy,
  onArchive,
  onMove
}: {
  prompts: Prompt[];
  projects: Project[];
  viewState: ViewState;
  onViewStateChange: (v: ViewState) => void;
  onSelect: (id: string) => void;
  onCopy: (prompt: Prompt) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, projectId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const filtered = useMemo(() => {
    const haystack = viewState === "empty" ? [] : prompts;
    return applyPromptFilters(haystack, {
      query: search,
      status: statusFilter,
      projectId: projectFilter,
      includeArchived: true
    });
  }, [prompts, viewState, search, statusFilter, projectFilter]);

  const body = () => {
    if (viewState === "loading") return <div className="text-sm text-slate-500">載入中…</div>;
    if (viewState === "error") return <div className="text-sm text-rose-600">載入失敗（dev 控制）。</div>;
    if (!filtered.length) return <div className="text-sm text-slate-500" data-testid="prompt-empty">查無結果或空狀態。</div>;
    return (
      <div className="space-y-2" data-testid="prompt-list">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-3 flex items-start justify-between gap-3" data-testid="prompt-item">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <button type="button" className="font-semibold text-left" onClick={() => onSelect(p.id)}>
                  {p.title}
                </button>
                <span className="text-xs text-slate-500">{p.status}</span>
              </div>
              <div className="text-xs text-slate-500 truncate">{p.body}</div>
              <div className="flex flex-wrap gap-1">
                {(p.tags || []).map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border bg-slate-50">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="h-9 px-3 rounded-lg border bg-white text-sm" onClick={() => onCopy(p)} aria-label="複製提示詞">
                複製
              </button>
              <select
                value={p.projectId}
                onChange={(e) => onMove(p.id, e.target.value)}
                className="h-9 px-2 rounded-lg border bg-white text-sm"
                aria-label="移動提示詞"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
              <button type="button" className="h-9 px-3 rounded-lg border bg-amber-500 text-white text-sm" onClick={() => onArchive(p.id)}>
                歸檔
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3" data-testid="prompt-list-panel">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋標題/內容/標籤"
            className="h-10 px-3 rounded-lg border bg-white text-sm min-w-[220px]"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border bg-white text-sm">
            <option value="all">狀態：全部</option>
            <option value="使用中">使用中</option>
            <option value="草稿">草稿</option>
            <option value="已歸檔">已歸檔</option>
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-10 px-3 rounded-lg border bg-white text-sm">
            <option value="all">專案：全部</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <DevStateToggle value={viewState} onChange={onViewStateChange} />
      </div>
      {body()}
    </div>
  );
}
