"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types/schema";

type TimelineItem = {
  id: string;
  date: string;
  label?: string;
  content: string;
  createdAt: string;
};

export default function ProjectTimeline({ project }: { project: Project | null }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");

  const canUse = Boolean(project?.id);

  const endpoint = useMemo(() => (project?.id ? `/api/projects/${project.id}/timeline` : null), [project?.id]);

  const load = async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const data = (await res.json()) as TimelineItem[];
      if (!res.ok) throw new Error((data as any)?.message ?? "無法載入進度紀錄");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!endpoint) {
      setItems([]);
      setError(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleAdd = async () => {
    if (!endpoint) return;
    if (!date.trim() || !content.trim()) {
      setError("請輸入日期與內容");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date.trim(), label: label.trim() || undefined, content: content.trim() })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.message ?? "新增失敗");
      setLabel("");
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!endpoint) return;
    if (!window.confirm("確定刪除此筆進度紀錄？")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.message ?? "刪除失敗");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-panel" style={{ padding: 0 }}>
      <div className="pm-panel-header px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--pm-border)" }}>
        <div>
          <div className="text-sm font-semibold">進度紀錄</div>
          <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
            以 `_timeline.json` 存在專案資料夾內。
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="pm-btn h-9 px-4 text-sm" disabled={!canUse || busy} onClick={() => void load()}>
            重新整理
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {error ? (
          <div className="text-[11px]" style={{ color: "var(--pm-danger)" }}>
            {error}
          </div>
        ) : null}

        <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
                日期
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canUse || busy}
                className="pm-input h-9 !text-sm"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
                標籤（選填）
              </div>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={!canUse || busy}
                placeholder="例如：里程碑"
                className="pm-input h-9 !text-sm"
              />
            </div>
            <div className="flex items-end justify-end">
              <button type="button" className="pm-btn pm-btn-primary h-9 px-4 text-sm disabled:opacity-60" disabled={!canUse || busy} onClick={() => void handleAdd()}>
                {busy ? "處理中…" : "新增進度"}
              </button>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
              內容
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!canUse || busy}
              rows={3}
              placeholder="例如：完成核心情境與提示詞清單"
              className="pm-textarea !min-h-[96px] !text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
            載入中…
          </div>
        ) : null}

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="pm-card" style={{ background: "#fff" }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="pm-badge pm-badge-accent text-[10px]">{it.date}</span>
                  {it.label ? <span className="pm-chip pm-chip-neutral">{it.label}</span> : null}
                </div>
                <button
                  type="button"
                  className="pm-btn h-8 px-3 text-[11px]"
                  style={{ border: "1px solid rgba(217, 95, 95, 0.35)", background: "rgba(217, 95, 95, 0.08)", color: "var(--pm-danger)" }}
                  disabled={!canUse || busy}
                  onClick={() => void handleDelete(it.id)}
                >
                  刪除
                </button>
              </div>
              <div className="mt-2 text-sm" style={{ whiteSpace: "pre-wrap", color: "var(--pm-text)" }}>
                {it.content}
              </div>
              <div className="mt-2 text-[11px]" style={{ color: "var(--pm-muted)" }}>
                建立於：{it.createdAt}
              </div>
            </div>
          ))}

          {!loading && items.length === 0 ? (
            <div className="rounded-[16px] px-4 py-3 text-xs" style={{ border: "1px dashed var(--pm-border)", background: "var(--pm-panel-ink)", color: "var(--pm-muted)" }}>
              尚未新增進度紀錄。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
