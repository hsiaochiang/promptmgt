"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PromptListItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { AsyncBoundary } from "./error-boundary";

interface Props {
  refreshKey?: number;
  onDeletePrompt?: (id: string) => Promise<void>;
  onSelectedWhileUnpinned?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  pinned?: boolean;
  onTogglePinned?: () => void;
}

export default function PromptList({ refreshKey = 0, onDeletePrompt, onSelectedWhileUnpinned, searchInputRef, pinned = true, onTogglePinned }: Props) {
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const selectedPromptId = useWorkspaceStore((s) => s.selectedPromptId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const filterStatus = useWorkspaceStore((s) => s.filterStatus);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useWorkspaceStore((s) => s.setSearchQuery);
  const setFilterStatus = useWorkspaceStore((s) => s.setFilterStatus);

  const fetchPrompts = useCallback(async () => {
    if (!selectedProjectId) {
      setPrompts([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ projectId: selectedProjectId });
      if (filterStatus !== "全部") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/prompts?${params.toString()}`);
      if (!res.ok) throw new Error("無法載入提示詞列表");
      const data = (await res.json()) as PromptListItem[];
      setPrompts(data);
      const hasSelected = data.some((p) => p.id === selectedPromptId);
      if (data.length === 0) {
        setSelectedPromptId(null);
      } else if (!selectedPromptId || !hasSelected) {
        setSelectedPromptId(data[0].id);
      }
    } catch (err) {
      setPrompts([]);
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery, selectedProjectId, selectedPromptId, setSelectedPromptId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts, refreshKey, filterStatus, searchQuery]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("全部" as any);
  };

  const handleCreate = async () => {
    if (!selectedProjectId) return;
    setBusy(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: {
            title: "未命名提示詞",
            project: selectedProjectId,
            type: "其他",
            status: "草稿",
            model: "",
            tags: [],
            updatedAt: now
          },
          body: ""
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as any)?.message ?? "新增提示詞失敗";
        throw new Error(msg);
      }
      const created = (await res.json()) as { id: string };
      await fetchPrompts();
      setSelectedPromptId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增提示詞失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-3 flex flex-col gap-2 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <div>
            專案：<span className="font-semibold text-slate-800">{selectedProjectId ?? "—"}</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋標題/模型/標籤"
              className="h-7 rounded border border-slate-300 px-2 text-xs bg-white focus:border-slate-400 focus:outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-7 rounded border border-slate-300 bg-white px-2 text-xs"
            >
              <option value="全部">全部狀態</option>
              <option value="使用中">使用中</option>
              <option value="草稿">草稿</option>
              <option value="已封存">已封存</option>
            </select>
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy || !selectedProjectId}
              className="px-2 py-1 rounded-full border border-slate-300 bg-white text-[11px] hover:bg-slate-50 disabled:opacity-60"
            >
              新增提示詞
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-2 py-1 rounded-full border border-slate-200 bg-white text-[11px] hover:bg-slate-50"
            >
              清除篩選
            </button>
            <button
              type="button"
              onClick={() => onTogglePinned?.()}
              className="px-2 py-1 rounded-full border border-slate-300 bg-white text-[11px] hover:bg-slate-50"
            >
              {pinned ? "Pin 已開" : "Pin 關閉"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>共 {prompts.length} 篇提示詞</span>
          {loading && <span className="text-[11px] text-slate-400">載入中…</span>}
        </div>
      </div>
      {error ? <div className="mb-2 text-[11px] text-amber-700">{error}</div> : null}
      {pendingDelete && (
        <div className="mb-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded flex items-center justify-between">
          <span>即將刪除，5 秒內可復原。</span>
          <button
            className="px-2 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-100"
            onClick={() => {
              if (undoTimer.current) clearTimeout(undoTimer.current);
              setPendingDelete(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
      <AsyncBoundary loading={loading} error={error} onRetry={fetchPrompts} label="提示詞列表">
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <div
              role="button"
              tabIndex={0}
              key={prompt.id}
              onClick={() => {
                setSelectedPromptId(prompt.id);
                if (!pinned) onSelectedWhileUnpinned?.();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedPromptId(prompt.id);
                  if (!pinned) onSelectedWhileUnpinned?.();
                }
              }}
              className={
                "w-full text-left rounded-lg border px-3 py-2 text-xs flex flex-col gap-1 hover:bg-slate-50 outline-none " +
                (prompt.id === selectedPromptId
                  ? "border-slate-900 bg-slate-900/5"
                  : "border-slate-200")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{prompt.title}</span>
                <span className="text-[10px] text-slate-400">更新：{prompt.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px]">
                    {prompt.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-slate-300 text-[10px]">
                    狀態：{prompt.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-slate-300 text-[10px]">
                    模型：{prompt.model}
                  </span>
                </div>
                <div className="flex gap-1">
                  {prompt.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePrompt?.(prompt.id);
                      setPendingDelete(prompt.id);
                      if (undoTimer.current) clearTimeout(undoTimer.current);
                      undoTimer.current = setTimeout(() => setPendingDelete(null), 5000);
                    }}
                    className="px-2 py-0.5 rounded-full border border-rose-200 text-rose-700 text-[10px] hover:bg-rose-50"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
          {prompts.length === 0 && !loading && (
            <div className="text-xs text-slate-400">尚無提示詞，請先將草稿轉正或新增提示詞。</div>
          )}
        </div>
      </AsyncBoundary>
    </div>
  );
}
