"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { PromptListItem } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { AsyncBoundary } from "./error-boundary";

interface Props {
  refreshKey?: number;
  onDeletePrompt?: (id: string) => Promise<void>;
}

export default function PromptList({ refreshKey = 0, onDeletePrompt }: Props) {
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const selectedPromptId = useWorkspaceStore((s) => s.selectedPromptId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const filterStatus = useWorkspaceStore((s) => s.filterStatus);

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
      const res = await fetch(`/api/prompts?projectId=${encodeURIComponent(selectedProjectId)}`);
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
  }, [selectedProjectId, selectedPromptId, setSelectedPromptId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts, refreshKey]);

  const filtered =
    filterStatus === "全部" ? prompts : prompts.filter((p) => p.status === "使用中");

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <div>
          專案：<span className="font-semibold text-slate-800">{selectedProjectId ?? "—"}</span>
        </div>
        <div className="flex gap-2">
          <span>共 {filtered.length} 篇提示詞</span>
        </div>
      </div>
      <AsyncBoundary loading={loading} error={error} onRetry={fetchPrompts} label="提示詞列表">
        <div className="space-y-2">
          {filtered.map((prompt) => (
            <div
              role="button"
              tabIndex={0}
              key={prompt.id}
              onClick={() => setSelectedPromptId(prompt.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedPromptId(prompt.id);
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
                    }}
                    className="px-2 py-0.5 rounded-full border border-rose-200 text-rose-700 text-[10px] hover:bg-rose-50"
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-xs text-slate-400">尚無提示詞，請先將草稿轉正或新增提示詞。</div>
          )}
        </div>
      </AsyncBoundary>
    </div>
  );
}
