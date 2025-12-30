"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PromptListItem } from "@/lib/types/schema";
import { formatForUI_MMDD_HHmm } from "@/lib/utils/date";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { AsyncBoundary } from "./error-boundary";
import ConfirmModal from "./confirm-modal";

interface Props {
  refreshKey?: number;
  onDeletePrompt?: (id: string) => Promise<void>;
  onSelectedWhileUnpinned?: () => void;
  onOpenPrompt?: (id: string) => void;
  onLoaded?: (prompts: PromptListItem[]) => void;
  projectIdFilter?: string | null;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  pinned?: boolean;
  onTogglePinned?: () => void;
  onScheduleUndo?: (message: string, commit: () => Promise<void>, onUndo?: () => void) => void;
}

export default function PromptList({
  refreshKey = 0,
  onDeletePrompt,
  onSelectedWhileUnpinned,
  onOpenPrompt,
  onLoaded,
  projectIdFilter,
  searchInputRef,
  pinned = true,
  onTogglePinned,
  onScheduleUndo
}: Props) {
  const [prompts, setPrompts] = useState<PromptListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [restoreQueue, setRestoreQueue] = useState<Array<{ frontmatter: any; body: string }>>([]);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const selectedPromptId = useWorkspaceStore((s) => s.selectedPromptId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const filterStatus = useWorkspaceStore((s) => s.filterStatus);
  const searchQuery = useWorkspaceStore((s) => s.searchQuery);
  const setSearchQuery = useWorkspaceStore((s) => s.setSearchQuery);
  const setFilterStatus = useWorkspaceStore((s) => s.setFilterStatus);

  const onLoadedRef = useRef<Props["onLoaded"]>(onLoaded);
  const hasExternalOpenRef = useRef<boolean>(!!onOpenPrompt);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    hasExternalOpenRef.current = !!onOpenPrompt;
  }, [onOpenPrompt]);

  const latestSelectedPromptId = useRef<string | null>(selectedPromptId);

  useEffect(() => {
    latestSelectedPromptId.current = selectedPromptId;
  }, [selectedPromptId]);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectIdFilter) params.set("projectId", projectIdFilter);
      if (filterStatus !== "全部") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/prompts?${params.toString()}`);
      if (!res.ok) throw new Error("無法載入提示詞列表");
      const data = (await res.json()) as PromptListItem[];
      setPrompts(data);
      onLoadedRef.current?.(data);
      setSelectedIds(new Set());
      if (!hasExternalOpenRef.current) {
        const hasSelected = data.some((p) => p.id === latestSelectedPromptId.current);
        if (data.length === 0) {
          setSelectedPromptId(null);
        } else if (!latestSelectedPromptId.current || !hasSelected) {
          setSelectedPromptId(data[0].id);
        }
      }
    } catch (err) {
      setPrompts([]);
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, projectIdFilter, searchQuery, setSelectedPromptId]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts, refreshKey]);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const fetchPromptDetail = async (id: string) => {
    const res = await fetch(`/api/prompts/${id}`);
    if (!res.ok) throw new Error("讀取提示詞失敗");
    const data = await res.json();
    return data as { frontmatter: any; body: string; hash?: string };
  };

  const restoreDeleted = async () => {
    if (restoreQueue.length === 0) return;
    const queue = [...restoreQueue];
    setRestoreQueue([]);
    for (const item of queue) {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter: item.frontmatter, body: item.body })
      });
    }
    await fetchPrompts();
    setBatchMessage(null);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`確定刪除選取的 ${selectedIds.size} 筆提示詞？`)) return;
    const backups: Array<{ frontmatter: any; body: string }> = prompts
      .filter((p) => selectedIds.has(p.id))
      .map((p) => ({
        frontmatter: {
          title: p.title,
          project: (p as any).projectId ?? (p as any).project,
          type: p.type,
          status: p.status,
          model: p.model,
          tags: p.tags,
          updatedAt: p.updatedAt
        },
        body: ""
      }));

    for (const id of selectedIds) {
      try {
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
      }
    }
    setRestoreQueue(backups);
    setBatchMessage("已刪除，5 秒內可復原");
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      setBatchMessage(null);
      setRestoreQueue([]);
    }, 5000);
    await fetchPrompts();
  };

  const [confirmPromptId, setConfirmPromptId] = useState<PromptListItem | null>(null);

  const schedule = onScheduleUndo ?? ((_, c, u) => { u?.(); return c(); });

  const handleDeleteSingle = (prompt: PromptListItem) => {
    const backup = prompt;
    setPrompts((list) => list.filter((p) => p.id !== prompt.id));
    if (selectedPromptId === prompt.id) {
      setSelectedPromptId(null);
    }
    const commit = async () => {
      setBusy(true);
      try {
        await onDeletePrompt?.(prompt.id);
        await fetchPrompts();
      } catch (err) {
        await fetchPrompts();
      } finally {
        setBusy(false);
      }
    };
    const undo = () => {
      setPrompts((list) => {
        if (list.find((p) => p.id === backup.id)) return list;
        return [backup, ...list];
      });
      setSelectedPromptId(backup.id);
    };
    schedule(`已排程刪除「${prompt.title}」，5 秒內可撤銷`, commit, undo);
  };

  const handleBatchArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`確定將 ${selectedIds.size} 筆提示詞歸檔？`)) return;
    const backups: Array<{ frontmatter: any; body: string }> = [];
    for (const id of selectedIds) {
      try {
        const detail = await fetchPromptDetail(id);
        backups.push({ frontmatter: detail.frontmatter, body: detail.body });
        await fetch(`/api/prompts/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter: { ...detail.frontmatter, status: "已封存" },
            body: detail.body,
            clientHash: detail.hash
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
    setRestoreQueue(backups);
    setBatchMessage("已歸檔，5 秒內可復原");
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      setBatchMessage(null);
      setRestoreQueue([]);
    }, 5000);
    await fetchPrompts();
  };

  const handleBatchDuplicate = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      try {
        const detail = await fetchPromptDetail(id);
        const title = `${detail.frontmatter?.title ?? "未命名"} 副本`;
        await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter: { ...detail.frontmatter, title, updatedAt: new Date().toISOString() },
            body: detail.body
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
    await fetchPrompts();
    setBatchMessage("已建立副本");
  };

  const handleBatchMove = async () => {
    if (selectedIds.size === 0) return;
    const targetProject = window.prompt("輸入要移動到的專案名稱", selectedProjectId ?? "");
    if (!targetProject || !targetProject.trim()) return;
    for (const id of selectedIds) {
      try {
        const detail = await fetchPromptDetail(id);
        await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter: { ...detail.frontmatter, project: targetProject, updatedAt: new Date().toISOString() },
            body: detail.body
          })
        });
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
      }
    }
    await fetchPrompts();
    setBatchMessage("已移動選取提示詞");
  };

  const handleBatchRename = async () => {
    if (selectedIds.size === 0) return;
    const newTitle = window.prompt("輸入新標題（套用於所有選取項）");
    if (!newTitle || !newTitle.trim()) return;
    for (const id of selectedIds) {
      try {
        const detail = await fetchPromptDetail(id);
        await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontmatter: { ...detail.frontmatter, title: newTitle.trim(), updatedAt: new Date().toISOString() },
            body: detail.body
          })
        });
        await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
      }
    }
    await fetchPrompts();
    setBatchMessage("已重新命名");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("全部" as any);
  };

  const handleCreate = async () => {
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
      <div className="mb-3 flex flex-col gap-2 text-xs" style={{ color: "var(--pm-muted)" }}>
        <div className="flex items-center justify-between">
          <div>
            專案：<span className="font-semibold" style={{ color: "var(--pm-text)" }}>{selectedProjectId ?? "—"}</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋標題/模型/標籤"
              className="h-9 pm-input !text-xs !px-3 !py-2"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-9 pm-select !text-xs !px-3 !py-2"
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
              className="pm-btn h-9 px-3 text-[11px] disabled:opacity-60"
            >
              新增提示詞
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="pm-btn h-9 px-3 text-[11px]"
            >
              清除篩選
            </button>
            <button
              type="button"
              onClick={() => onTogglePinned?.()}
              className="pm-btn h-9 px-3 text-[11px]"
            >
              {pinned ? "Pin 已開" : "Pin 關閉"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>共 {prompts.length} 篇提示詞</span>
          {loading && <span className="text-[11px]" style={{ color: "var(--pm-muted)" }}>載入中…</span>}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-[11px] items-center px-3 py-2 rounded" style={{ background: "var(--pm-panel-ink)", border: "1px solid var(--pm-border)" }}>
          <span>已選 {selectedIds.size} 筆</span>
          <button data-testid="batch-rename" onClick={handleBatchRename} className="pm-btn h-8 px-3 text-[11px]">
            批次重新命名
          </button>
          <button data-testid="batch-duplicate" onClick={handleBatchDuplicate} className="pm-btn h-8 px-3 text-[11px]">
            批次複製
          </button>
          <button data-testid="batch-move" onClick={handleBatchMove} className="pm-btn h-8 px-3 text-[11px]">
            批次移動
          </button>
          <button data-testid="batch-archive" onClick={handleBatchArchive} className="pm-btn h-8 px-3 text-[11px] pm-btn-accent">
            批次歸檔
          </button>
          <button
            data-testid="batch-delete"
            onClick={handleBatchDelete}
            className="pm-btn h-8 px-3 text-[11px]"
            style={{ border: "none", background: "linear-gradient(135deg, #d96b6b 0%, #c94d4d 100%)", color: "#fff" }}
          >
            批次刪除
          </button>
          <button onClick={clearSelection} className="pm-btn h-8 px-3 text-[11px]">
            取消選取
          </button>
        </div>
      )}

      {batchMessage && (
        <div className="mb-2 text-[11px] px-3 py-2 rounded flex items-center justify-between" style={{ background: "rgba(212, 163, 115, 0.14)", border: "1px solid rgba(212, 163, 115, 0.35)", color: "#8a5a2a" }}>
          <span>{batchMessage}</span>
          <button
            className="pm-btn h-8 px-3 text-[11px]"
            onClick={restoreDeleted}
          >
            Undo
          </button>
        </div>
      )}

      {error ? (
        <div className="mb-2 text-[11px]" style={{ color: "var(--pm-danger)" }}>
          {error}
        </div>
      ) : null}
      <AsyncBoundary loading={loading} error={error} onRetry={fetchPrompts} label="提示詞列表">
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <div
              role="button"
              tabIndex={0}
              key={prompt.id}
              onClick={() => {
                if (onOpenPrompt) {
                  onOpenPrompt(prompt.id);
                } else {
                  setSelectedPromptId(prompt.id);
                  if (!pinned) onSelectedWhileUnpinned?.();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (onOpenPrompt) {
                    onOpenPrompt(prompt.id);
                  } else {
                    setSelectedPromptId(prompt.id);
                    if (!pinned) onSelectedWhileUnpinned?.();
                  }
                }
              }}
              className={
                "w-full text-left rounded-[16px] border px-4 py-3 text-xs flex flex-col gap-2 outline-none transition-all " +
                (prompt.id === selectedPromptId ? "bg-white" : "bg-white")
              }
              style={{ borderColor: prompt.id === selectedPromptId ? "rgba(47, 111, 111, 0.45)" : "var(--pm-border)", boxShadow: prompt.id === selectedPromptId ? "0 12px 26px rgba(47, 111, 111, 0.1)" : "none" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    data-testid={`select-${prompt.id}`}
                    checked={selectedIds.has(prompt.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(prompt.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-semibold truncate">{prompt.title}</span>
                </div>
                <span className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
                  更新：{formatForUI_MMDD_HHmm(prompt.updatedAt ?? "")}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="pm-badge pm-badge-brand text-[10px]">{prompt.type}</span>
                  <span className="pm-badge text-[10px]" style={{ color: "var(--pm-muted)" }}>
                    狀態：{prompt.status}
                  </span>
                  <span className="pm-badge text-[10px]" style={{ color: "var(--pm-muted)" }}>
                    模型：{prompt.model || "—"}
                  </span>
                </div>
                <div className="flex gap-1">
                  {prompt.tags.map((t) => (
                    <span
                      key={`${prompt.id}-${t.code}`}
                      className="pm-chip pm-chip-neutral"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmPromptId(prompt);
                    }}
                    className="pm-btn h-7 px-3 text-[10px]"
                    style={{ border: "1px solid rgba(217, 95, 95, 0.35)", background: "rgba(217, 95, 95, 0.08)", color: "var(--pm-danger)" }}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && prompts.length === 0 && (
            <div className="rounded-[16px] px-4 py-3 text-xs" style={{ border: "1px dashed var(--pm-border)", background: "var(--pm-panel-ink)", color: "var(--pm-muted)" }}>
              目前沒有提示詞，請先新增一筆或調整篩選條件。
            </div>
          )}
        </div>
      </AsyncBoundary>
      <ConfirmModal
        open={!!confirmPromptId}
        title="確認刪除提示詞"
        description={confirmPromptId ? `將刪除「${confirmPromptId.title}」，5 秒內可 Undo。` : ""}
        confirmText="刪除"
        cancelText="取消"
        onCancel={() => setConfirmPromptId(null)}
        onConfirm={() => {
          if (confirmPromptId) handleDeleteSingle(confirmPromptId);
          setConfirmPromptId(null);
        }}
      />
    </div>
  );
}
