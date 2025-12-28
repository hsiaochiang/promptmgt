"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types/schema";

interface Props {
  projects: Project[];
  onScheduleUndo?: (message: string, commit: () => Promise<void>, onUndo?: () => void) => void;
}

type ScratchpadItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "pm-scratchpad-items-v1";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deriveTitle(content: string) {
  const firstLine = content.split(/\r?\n/)[0]?.trim() ?? "";
  if (firstLine) return firstLine.slice(0, 50);
  return "未命名";
}

export default function Scratchpad({ projects, onScheduleUndo }: Props) {
  void projects;
  void onScheduleUndo;

  const [items, setItems] = useState<ScratchpadItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loaded = safeJsonParse<ScratchpadItem[]>(window.localStorage.getItem(STORAGE_KEY)) ?? [];
    if (!Array.isArray(loaded)) return;
    setItems(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? null, [items, selectedId]);
  const listCount = items.length;

  const clearDraft = () => {
    setDraft("");
    textareaRef.current?.focus();
  };

  const addToList = () => {
    const content = draft.trimEnd();
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const next: ScratchpadItem = {
      id: newId(),
      title: deriveTitle(content),
      content,
      createdAt: now
    };
    setItems((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setDraft("");
    setMessage("已加入列表");
    window.setTimeout(() => setMessage(null), 1600);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage("已複製");
    window.setTimeout(() => setMessage(null), 1400);
  };

  const copySelected = async () => {
    if (selected?.content) return copyText(selected.content);
    if (draft.trim()) return copyText(draft);
    setMessage("目前沒有可複製內容");
    window.setTimeout(() => setMessage(null), 1400);
  };

  const quickFill = () => {
    if (!draft.trim()) {
      setDraft("把零碎想法放在這裡，稍後整理成提示詞。\n\n- 目標：\n- 受眾：\n- 輸出格式：\n");
    }
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="flex flex-1 overflow-hidden gap-6">
      <section className="pm-panel flex-[1.5] p-6 flex flex-col gap-4 overflow-hidden">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--pm-brand-strong)" }}>
              剪貼簿
            </div>
            <div className="text-lg font-bold">快速草稿</div>
            <div className="text-xs mt-1" style={{ color: "var(--pm-muted)" }}>
              快速記下內容，稍後整理成提示詞或複製使用。
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearDraft}
              className="pm-btn h-9 px-4 text-sm"
              data-testid="scratchpad-clear"
            >
              清空輸入
            </button>
            <button
              type="button"
              onClick={addToList}
              className="pm-btn pm-btn-primary h-9 px-4 text-sm"
              data-testid="scratchpad-add"
            >
              加入列表
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="text-sm font-semibold mb-2">剪貼簿列表</div>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border px-4 py-3 text-sm flex items-center justify-between gap-3"
                style={{
                  borderColor: item.id === selectedId ? "rgba(47, 111, 111, 0.45)" : "var(--pm-border)",
                  background: "var(--pm-panel-ink)",
                  boxShadow: item.id === selectedId ? "0 12px 26px rgba(47, 111, 111, 0.10)" : "none"
                }}
              >
                <button
                  type="button"
                  className="flex-1 text-left"
                  data-testid={`scratchpad-item-${item.id}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="font-semibold truncate">{item.title}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--pm-muted)" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </button>
                <button
                  type="button"
                  className="pm-btn h-8 px-3 text-[11px]"
                  data-testid={`scratchpad-item-copy-${item.id}`}
                  onClick={() => void copyText(item.content)}
                >
                  複製
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div
                className="rounded-[16px] px-4 py-3 text-sm"
                style={{ border: "1px dashed var(--pm-border)", background: "var(--pm-panel-ink)", color: "var(--pm-muted)" }}
              >
                目前列表是空的，可用下方「快速新增」加入。
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold">快速新增</div>
            <div className="mt-2 rounded-[16px] border p-4" style={{ borderColor: "var(--pm-border)", background: "var(--pm-panel)" }}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                data-testid="scratchpad-textarea"
                className="w-full min-h-[220px] rounded-[14px] border bg-[color:var(--pm-panel)] px-4 py-3 text-sm font-mono focus:outline-none"
                style={{ borderColor: "var(--pm-border)" }}
                placeholder="把零碎想法放在這裡，稍後整理成提示詞。"
              />
              <div className="mt-2 text-xs" style={{ color: "var(--pm-muted)" }}>
                {message ? <span style={{ color: "var(--pm-brand-strong)" }}>{message}</span> : "把草稿加入列表，或先複製內容再貼到提示詞。"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="pm-panel flex-1 p-6 flex flex-col gap-4">
        <div className="text-sm font-semibold">剪貼簿操作</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="pm-btn h-9 px-4 text-sm"
            onClick={() => void copySelected()}
            data-testid="scratchpad-copy"
          >
            複製內容
          </button>
          <button type="button" className="pm-btn h-9 px-4 text-sm" onClick={quickFill}>
            快速新增
          </button>
        </div>
        <div className="pm-card mt-2" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
            列表數量
          </div>
          <div className="text-lg font-semibold" style={{ color: "var(--pm-text)" }}>
            <span data-testid="scratchpad-count">{listCount}</span>
          </div>
        </div>
        <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
          {selected ? `已選擇：${selected.title}` : "尚未選擇項目，會複製輸入框內容。"}
        </div>
      </aside>
    </div>
  );
}
