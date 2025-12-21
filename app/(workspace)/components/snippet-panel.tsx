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
    <div className="w-64 bg-white flex flex-col border border-slate-200 rounded-lg overflow-hidden">
      <div className="h-8 px-3 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200">
        <span>常用片語剪貼簿</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400">{snippets.length} 條</span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-0.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
              data-testid="snippet-close"
            >
              關閉
            </button>
          )}
          <button
            onClick={startCreate}
            data-testid="snippet-add-trigger"
            className="px-2 py-0.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
          >
            新增
          </button>
        </div>
      </div>
      <div className="p-2 border-b border-slate-100 text-[10px] flex items-center gap-1">
        <input
          className="flex-1 rounded-full border border-slate-300 bg-white px-2 py-1 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          placeholder="搜尋片語名稱或內容"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {formOpen && (
        <div className="border-b border-slate-100 p-2 space-y-2 text-[11px] bg-slate-50">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500">名稱</div>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
              value={form.name}
              placeholder="名稱"
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500">分類</div>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
              value={form.category}
              placeholder="分類"
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500">內容</div>
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] min-h-[80px]"
              value={form.content}
              placeholder="內容"
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setFormOpen(false)}
              className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={saveSnippet}
              data-testid="snippet-save"
              className="px-2 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              {formMode === "create" ? "新增" : "更新"}
            </button>
          </div>
        </div>
      )}
      {loading && <div className="text-[10px] text-slate-400 px-3 py-2">載入中…</div>}
      {error && (
        <div className="text-[10px] text-amber-700 px-3 py-2 bg-amber-50 border border-amber-200">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-auto p-2 space-y-2 text-[11px]">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold truncate">{s.name}</span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                使用 {s.usageCount ?? s.usage ?? 0}
                {busyId === s.id && <span className="text-amber-600">更新中…</span>}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">{s.content}</div>
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
