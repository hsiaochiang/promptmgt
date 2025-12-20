"use client";

import { useEffect, useState } from "react";
import type { InboxItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLoaded: (items: InboxItem[]) => void;
}

function formatPreview(text: string) {
  if (!text) return "（無內容）";
  return text.length > 50 ? `${text.slice(0, 50)}…` : text;
}

export default function InboxList({ selectedId, onSelect, onLoaded }: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const setInboxCount = useWorkspaceStore((s) => s.setInboxCount);

  const fetchList = async () => {
    setLoading(true);
    const res = await fetch("/api/inbox");
    const data = (await res.json()) as InboxItem[];
    setItems(data);
    setInboxCount(data.length);
    onLoaded(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "新草稿", content: "", hint: "" })
    });
    const created = (await res.json()) as InboxItem;
    const next = [created, ...items];
    setItems(next);
    setInboxCount(next.length);
    onLoaded(next);
    onSelect(created.id);
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500">未歸檔收件匣</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-600 font-medium">{items.length} 筆待整理</span>
          <button
            onClick={handleCreate}
            className="text-[11px] px-2 py-1 rounded-full border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
          >
            新增草稿
          </button>
        </div>
      </div>
      {loading && <div className="text-[11px] text-slate-400">載入中…</div>}
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
      </div>
    </div>
  );
}
