"use client";

import { useEffect, useMemo, useState } from "react";
import type { Snippet } from "@/lib/types/schema";

interface Props {
  onInsert: (snippet: Snippet) => Promise<Snippet | void>;
}

export default function SnippetPanel({ onInsert }: Props) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnippets = async () => {
      setLoading(true);
      const res = await fetch("/api/snippets");
      const data = (await res.json()) as Snippet[];
      setSnippets(data);
      setLoading(false);
    };
    fetchSnippets();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return snippets;
    return snippets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q)
    );
  }, [snippets, search]);

  return (
    <div className="w-56 bg-white flex flex-col border border-slate-200 rounded-lg overflow-hidden">
      <div className="h-8 px-3 flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-200">
        <span>常用片語剪貼簿</span>
        <span className="text-[10px] text-slate-400">{snippets.length} 條</span>
      </div>
      <div className="p-2 border-b border-slate-100 text-[10px] flex items-center gap-1">
        <input
          className="flex-1 rounded-full border border-slate-300 bg-white px-2 py-1 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          placeholder="搜尋片語名稱或內容"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading && <div className="text-[10px] text-slate-400 px-3 py-2">載入中…</div>}
      {error && (
        <div className="text-[10px] text-amber-700 px-3 py-2 bg-amber-50 border border-amber-200">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-auto p-2 space-y-2 text-[11px]">
        {filtered.map((s) => (
          <button
            key={s.id}
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
                      item.id === s.id ? { ...item, usage: item.usage + 1, lastUsedAt: new Date().toISOString() } : item
                    )
                  );
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : "插入失敗");
              } finally {
                setBusyId(null);
              }
            }}
            className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 hover:bg-slate-100 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold truncate">{s.name}</span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                使用 {s.usage}
                {busyId === s.id && <span className="text-amber-600">更新中…</span>}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">{s.content}</div>
            <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100">{s.category}</span>
              <span>點擊插入到游標</span>
            </div>
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-[10px] text-slate-400 px-2">無符合片語，試試其他關鍵字。</div>
        )}
      </div>
    </div>
  );
}
