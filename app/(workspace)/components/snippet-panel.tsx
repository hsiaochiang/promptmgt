"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Snippet } from "@/lib/types/schema";

interface Props {
  onInsert: (snippet: Snippet) => Promise<Snippet | void>;
  onClose?: () => void;
}

interface SnippetForm {
  id?: string;
  name: string;
  category: string;
  content: string;
}

export default function SnippetPanel({ onInsert, onClose }: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<SnippetForm>({ name: "", category: "其他", content: "" });

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    const query = search.trim();
    const url = query ? `/api/snippets?q=${encodeURIComponent(query)}` : "/api/snippets";
    const res = await fetch(url);
    const data = (await res.json()) as Snippet[];
    setSnippets(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  useEffect(() => {
    if (!insertedId) return;
    const timer = window.setTimeout(() => setInsertedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [insertedId]);

  const filtered = useMemo(() => snippets, [snippets]);

  const startCreate = () => {
    setForm({ name: "", category: "其他", content: "" });
    setFormMode("create");
    setFormOpen(true);
  };

  const startEdit = (snippet: Snippet) => {
    setForm({ id: snippet.id, name: snippet.name, category: snippet.category, content: snippet.content });
    setFormMode("edit");
    setFormOpen(true);
  };

  const saveSnippet = async () => {
    setError(null);
    const payload = { ...form };
    try {
      const target = formMode === "create" ? "/api/snippets" : `/api/snippets/${form.id}`;
      const res = await fetch(target, {
        method: formMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("儲存片語失敗");
      const saved = (await res.json()) as Snippet;
      if (formMode === "create") {
        setSnippets((prev) => [saved, ...prev]);
      } else {
        setSnippets((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      }
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存片語失敗");
    }
  };

  const deleteSnippet = async (snippet: Snippet) => {
    if (!window.confirm(`刪除片語「${snippet.name}」？`)) return;
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("刪除失敗");
      setSnippets((prev) => prev.filter((s) => s.id !== snippet.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除片語失敗");
    }
  };

  return (
    <div className="w-full flex flex-col overflow-hidden" style={{ background: "var(--pm-panel)", color: "var(--pm-text)" }}>
      <div className="h-10 px-4 flex items-center justify-between text-[11px] pm-panel-header">
        <span>常用片語剪貼簿</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
            {snippets.length} 條
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="pm-btn h-7 px-3 text-[11px]"
              data-testid="snippet-close"
            >
              關閉
            </button>
          )}
          <button
            onClick={startCreate}
            data-testid="snippet-add-trigger"
            className="pm-btn h-7 px-3 text-[11px]"
          >
            新增
          </button>
        </div>
      </div>
      <div className="p-3 text-[11px] flex items-center gap-1" style={{ borderBottom: "1px solid var(--pm-border)" }}>
        <input
          className="flex-1 rounded-full border bg-[color:var(--pm-panel)] px-3 py-2 outline-none"
          style={{ borderColor: "var(--pm-border)" }}
          placeholder="搜尋片語名稱或內容"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {formOpen && (
        <div className="p-3 space-y-2 text-[11px]" style={{ background: "var(--pm-panel-ink)", borderBottom: "1px solid var(--pm-border)" }}>
          <div className="space-y-1">
            <div className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
              名稱
            </div>
            <input
              className="w-full border rounded-[14px] px-3 py-2 text-[11px]"
              style={{ borderColor: "var(--pm-border)", background: "var(--pm-panel)" }}
              value={form.name}
              placeholder="名稱"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
              分類
            </div>
            <input
              className="w-full border rounded-[14px] px-3 py-2 text-[11px]"
              style={{ borderColor: "var(--pm-border)", background: "var(--pm-panel)" }}
              value={form.category}
              placeholder="分類"
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
              內容
            </div>
            <textarea
              className="w-full border rounded-[14px] px-3 py-2 text-[11px] min-h-[96px]"
              style={{ borderColor: "var(--pm-border)", background: "var(--pm-panel)" }}
              value={form.content}
              placeholder="內容"
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setFormOpen(false)}
              className="pm-btn h-8 px-3 text-[11px]"
            >
              取消
            </button>
            <button
              onClick={saveSnippet}
              data-testid="snippet-save"
              className="pm-btn pm-btn-primary h-8 px-3 text-[11px]"
            >
              {formMode === "create" ? "新增" : "更新"}
            </button>
          </div>
        </div>
      )}
      {loading && (
        <div className="text-[11px] px-4 py-3" style={{ color: "var(--pm-muted)" }}>
          載入中…
        </div>
      )}
      {error && (
        <div className="text-[11px] px-4 py-3" style={{ color: "var(--pm-danger)", background: "rgba(217,95,95,0.08)", borderTop: "1px solid rgba(217,95,95,0.25)", borderBottom: "1px solid rgba(217,95,95,0.25)" }}>
          {error}
        </div>
      )}
      <div className="flex-1 overflow-auto p-3 space-y-2 text-[11px]">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-[14px] px-3 py-2 flex flex-col gap-1"
            style={{ border: "1px solid var(--pm-border)", background: "var(--pm-panel-ink)" }}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold truncate">{s.name}</span>
              <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--pm-muted)" }}>
                使用 {s.usageCount ?? s.usage ?? 0}
                {busyId === s.id && <span className="text-amber-600">更新中…</span>}
                {insertedId === s.id && (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(47,111,111,0.12)", color: "var(--pm-brand-strong)", border: "1px solid rgba(47,111,111,0.25)" }}
                    data-testid={`snippet-inserted-${s.id}`}
                  >
                    已插入
                  </span>
                )}
              </span>
            </div>
            <div className="text-[11px] truncate" style={{ color: "var(--pm-muted)" }}>
              {s.content}
            </div>
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100">{s.category}</span>
              <span>點擊插入到游標</span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1">
              <div className="flex gap-1">
                <button
                  onClick={async () => {
                    setBusyId(s.id);
                    setError(null);
                    try {
                      const updated = await onInsert(s);
                      if (updated) {
                        setSnippets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                      } else {
                        setSnippets((prev) =>
                          prev.map((item) =>
                            item.id === s.id
                              ? {
                                  ...item,
                                  usage: (item.usageCount ?? item.usage ?? 0) + 1,
                                  usageCount: (item.usageCount ?? item.usage ?? 0) + 1,
                                  lastUsedAt: new Date().toISOString()
                                }
                              : item
                          )
                        );
                      }
                      setInsertedId(s.id);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "插入失敗");
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="px-2 py-0.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
                  disabled={busyId === s.id}
                >
                  插入
                </button>
                <button
                  onClick={() => startEdit(s)}
                  data-testid={`snippet-edit-${s.id}`}
                  className="px-2 py-0.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
                >
                  編輯
                </button>
              </div>
              <button
                onClick={() => deleteSnippet(s)}
                data-testid={`snippet-delete-${s.id}`}
                className="px-2 py-0.5 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-[10px] text-slate-400 px-2">無符合片語，試試其他關鍵字。</div>
        )}
      </div>
    </div>
  );
}
