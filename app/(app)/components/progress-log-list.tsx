"use client";

import React, { useMemo, useState } from "react";
import { ProgressLog } from "../providers/mock-app";
import { DevStateToggle, ViewState } from "./dev-state-toggle";

export function ProgressLogList({
  logs,
  onUpdate,
  onAdd,
  viewState,
  onViewStateChange
}: {
  logs: ProgressLog[];
  onUpdate: (logId: string, patch: ProgressLog) => void;
  onAdd: () => ProgressLog | null;
  viewState: ViewState;
  onViewStateChange: (v: ViewState) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ProgressLog>>({});

  const sortedLogs = useMemo(() => logs.slice().sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)), [logs]);

  const beginEdit = (log: ProgressLog) => {
    setEditingId(log.id);
    setDrafts((prev) => ({ ...prev, [log.id]: { ...log } }));
  };

  const updateDraft = (logId: string, patch: Partial<ProgressLog>) => {
    setDrafts((prev) => ({ ...prev, [logId]: { ...prev[logId], ...patch } }));
  };

  const cancelEdit = () => {
    if (editingId) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[editingId];
        return next;
      });
    }
    setEditingId(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const draft = drafts[editingId];
    if (!draft) {
      setEditingId(null);
      return;
    }
    onUpdate(editingId, draft);
    setEditingId(null);
  };

  const renderBody = () => {
    if (viewState === "loading") return <div className="text-sm text-slate-500">載入中…</div>;
    if (viewState === "error") return <div className="text-sm text-rose-600">載入失敗（dev 控制）。</div>;

    const effectiveLogs = viewState === "empty" ? [] : sortedLogs;
    if (!effectiveLogs.length) return <div className="text-sm text-slate-500">尚無進度紀錄。</div>;

    return (
      <div className="space-y-3">
        {effectiveLogs.map((log) => {
          const isEditing = editingId === log.id;
          const draft = drafts[log.id] ?? log;
          return (
            <div key={log.id} className="rounded-2xl border bg-white p-3" data-testid="progress-log-row">
              {!isEditing ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{log.date || "未填日期"}</div>
                    <div className="text-sm text-slate-700" data-testid="progress-log-summary">
                      {log.summary || "未填寫"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-indigo-600" data-testid="progress-log-link">
                      連結
                    </span>
                    <button type="button" className="px-3 py-1 rounded-lg border bg-white" onClick={() => beginEdit(log)} aria-label="編輯進度">
                      編輯
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2" data-testid="progress-log-editing">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={draft.date}
                      onChange={(e) => updateDraft(log.id, { date: e.target.value })}
                      placeholder="YYYY-MM-DD"
                      className="h-10 px-3 rounded-lg border bg-white text-sm"
                    />
                    <input
                      value={draft.link || ""}
                      onChange={(e) => updateDraft(log.id, { link: e.target.value })}
                      placeholder="連結（可選）"
                      className="h-10 px-3 rounded-lg border bg-white text-sm"
                    />
                  </div>
                  <textarea
                    value={draft.summary}
                    onChange={(e) => updateDraft(log.id, { summary: e.target.value })}
                    className="w-full min-h-[80px] rounded-lg border bg-white p-2 text-sm"
                    placeholder="簡短說明"
                  />
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-3 py-2 rounded-lg border bg-slate-900 text-white text-sm" onClick={saveEdit}>
                      儲存
                    </button>
                    <button type="button" className="px-3 py-2 rounded-lg border bg-white text-sm" onClick={cancelEdit} data-testid="progress-log-cancel">
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3" data-testid="progress-log-list">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">進度紀錄</div>
          <div className="text-xs text-slate-500">預設唯讀；按「編輯」才可修改；取消會復原。</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-2 rounded-lg border bg-emerald-600 text-white text-sm"
            onClick={() => {
              const created = onAdd();
              if (created) {
                setEditingId(created.id);
                setDrafts((prev) => ({ ...prev, [created.id]: { ...created } }));
              }
            }}
          >
            新增紀錄
          </button>
          <DevStateToggle value={viewState} onChange={onViewStateChange} />
        </div>
      </div>
      {renderBody()}
    </div>
  );
}
