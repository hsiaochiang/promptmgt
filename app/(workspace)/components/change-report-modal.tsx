"use client";

import React, { useEffect, useState } from "react";

export interface ChangeReportItem {
  id: string;
  kind: "prompt" | "inbox";
  title: string;
  action: string;
  timestamp: string;
  path?: string;
  projectId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: ChangeReportItem) => void;
  onQuickAdd: () => Promise<void> | void;
}

export default function ChangeReportModal({ open, onClose, onSelect, onQuickAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ChangeReportItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings/change-report");
        if (!res.ok) throw new Error("載入失敗");
        const data = (await res.json()) as ChangeReportItem[];
        if (!cancelled) setItems(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleSelect = (item: ChangeReportItem) => {
    onSelect(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="font-semibold text-sm text-slate-800">今日變更報告</div>
            <div className="text-[11px] text-slate-500">近 24 小時提示詞/草稿變更，最多 50 筆</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => onQuickAdd()}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50"
            >
              快速新增並開啟
            </button>
            <button className="text-slate-500 hover:text-slate-800" onClick={onClose}>
              關閉
            </button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto px-5 py-4 space-y-3">
          {loading && <div className="text-sm text-slate-500">載入中…</div>}
          {error && <div className="text-sm text-rose-600">{error}</div>}
          {!loading && !error && items.length === 0 && <div className="text-sm text-slate-500">今日尚無變更</div>}
          {!loading && !error &&
            items.map((item) => (
              <button
                key={`${item.kind}-${item.id}-${item.timestamp}`}
                onClick={() => handleSelect(item)}
                className="w-full text-left rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-[1px] hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                      {item.kind === "prompt" ? "提示詞" : "草稿"}
                    </span>
                    <span>{item.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.path ?? item.projectId ?? "收件匣"}</div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
