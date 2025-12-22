"use client";

import React, { useEffect, useState } from "react";
import type { InboxItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getInboxPageSize } from "@/lib/utils/config";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLoaded: (items: InboxItem[]) => void;
  refreshKey?: number;
}

function formatPreview(text: string) {
  if (!text) return "（無內容）";
  return text.length > 50 ? `${text.slice(0, 50)}…` : text;
}

export default function InboxList({ selectedId, onSelect, onLoaded, refreshKey = 0 }: Props) {
  const pageSize = getInboxPageSize();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const setInboxCount = useWorkspaceStore((s) => s.setInboxCount);

  const fetchList = async (nextPage: number, nextQuery: string) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(nextPage * pageSize)
    });
    if (nextQuery.trim()) params.set("q", nextQuery.trim());

    const res = await fetch(`/api/inbox?${params.toString()}`);
    const data = await res.json();
    const list = Array.isArray(data) ? (data as InboxItem[]) : ((data.items as InboxItem[]) ?? []);
    const totalCount = Array.isArray(data)
      ? list.length
      : typeof data.total === "number"
        ? data.total
        : list.length;

    // 如果當前頁資料為空但仍有總數，回退一頁避免空白狀態
    if (!Array.isArray(data) && list.length === 0 && totalCount > 0 && nextPage > 0) {
      setPage(nextPage - 1);
      setLoading(false);
      return;
    }

    setItems(list);
    setTotal(totalCount);
    setInboxCount(totalCount);
    onLoaded(list);
    setLoading(false);
  };

  const handleCreate = async () => {
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "新草稿", content: "", hint: "" })
    });
    const created = (await res.json()) as InboxItem;
    setSearchInput("");
    setQuery("");
    setPage(0);
    await fetchList(0, "");
    onSelect(created.id);
  };

  useEffect(() => {
    fetchList(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, page, query]);

  const hasPrev = page > 0;
  const hasNext = (page + 1) * pageSize < total;
  const showingStart = total === 0 ? 0 : page * pageSize + 1;
  const showingEnd = Math.min(total, (page + 1) * pageSize);

  return (
    <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">未歸檔收件匣</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(0);
                setQuery(searchInput.trim());
              }
            }}
            placeholder="搜尋草稿標題/內容"
            className="text-[11px] px-2 py-1 rounded border border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
          />
          <button
            onClick={() => {
              setPage(0);
              setQuery(searchInput.trim());
            }}
            className="text-[11px] px-2 py-1 rounded-full border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          >
            搜尋/過濾
          </button>
          {query && (
            <button
              onClick={() => {
                setSearchInput("");
                setQuery("");
                setPage(0);
              }}
              className="text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-500"
            >
              清除
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-600 font-medium">
            顯示 {showingStart}-{showingEnd} / 共 {total} 筆
          </span>
          <button
            onClick={handleCreate}
            className="text-[11px] px-2 py-1 rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
          >
            新增草稿
          </button>
        </div>
      </div>
      {loading && <div className="text-[11px] text-slate-400">載入中…</div>}
      {total > 100 && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          草稿超過 100 筆，請使用搜尋或分頁逐步整理，避免介面過載。
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className={
              "w-full text-left rounded-lg border px-3 py-2 text-[11px] space-y-0.5 " +
              (i.id === selectedId
                ? "border-amber-400 bg-amber-50"
                : "border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100")
            }
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold truncate">{i.title}</div>
              <span className="text-[10px] text-amber-700">建立：{i.createdAt}</span>
            </div>
            <div className="text-[10px] text-amber-700 flex justify-between gap-2">
              <span className="truncate">{i.hint || "尚未指定專案與標籤"}</span>
              <span className="text-slate-400">更新：{i.updatedAt}</span>
            </div>
            <div className="text-[10px] text-slate-600 truncate">{formatPreview(i.content)}</div>
          </button>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-[11px] text-slate-400">沒有符合條件的草稿</div>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrev}
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
          >
            上一頁
          </button>
          <button
            onClick={() => hasNext && setPage((p) => p + 1)}
            disabled={!hasNext}
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
        <div className="text-[10px] text-slate-500">每頁 {pageSize} 筆</div>
      </div>
    </div>
  );
}
