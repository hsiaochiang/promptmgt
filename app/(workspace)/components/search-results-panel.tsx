"use client";

import React, { useEffect, useState } from "react";

interface SearchMatch {
  id: string;
  title: string;
  projectId?: string;
  status?: string;
  model?: string;
  tags?: string[];
  snippet?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface Props {
  query: string;
  limit?: number;
}

export default function SearchResultsPanel({ query, limit = 1000 }: Props) {
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setTruncated(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: trimmed, limit: String(limit) });
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("搜尋失敗，請稍後重試");
        const payload = (await res.json()) as { results?: SearchMatch[]; truncated?: boolean };
        setResults(Array.isArray(payload.results) ? payload.results : []);
        setTruncated(Boolean(payload.truncated));
      } catch (err) {
        setResults([]);
        setTruncated(false);
        setError(err instanceof Error ? err.message : "搜尋失敗");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [limit, query]);

  return (
    <div className="space-y-2 text-xs" data-testid="search-result-panel">
      {loading && <div data-testid="search-loading">搜尋中…</div>}
      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-2" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          {truncated && (
            <div
              data-testid="search-truncated"
              className="text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2"
            >
              僅顯示前 1000 筆，請收斂搜尋條件（篩選專案/狀態或縮小關鍵字）。
            </div>
          )}
          {results.length === 0 ? (
            <div data-testid="search-empty" className="text-slate-500">
              沒有符合結果，請縮小搜尋條件或檢查關鍵字。
            </div>
          ) : (
            <ul className="space-y-1" data-testid="search-results">
              {results.map((item) => (
                <li key={item.id} className="rounded border border-slate-200 bg-white px-3 py-2">
                  <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                    {item.projectId && <span>專案：{item.projectId}</span>}
                    {item.status && <span>狀態：{item.status}</span>}
                    {item.model && <span>模型：{item.model}</span>}
                  </div>
                  {item.snippet && <div className="text-[11px] text-slate-600 truncate">{item.snippet}</div>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
