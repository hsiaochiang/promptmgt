"use client";

import React, { useEffect, useState } from "react";
import type { InboxItem } from "@/lib/types/schema";
import { useAutosaveDraft } from "../hooks/useAutosaveDraft";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Props {
  draft: InboxItem | null;
}

const LARGE_PASTE_THRESHOLD = 100000;

export default function DraftEditor({ draft }: Props) {
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [content, setContent] = useState("");
  const [pasting, setPasting] = useState(false);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const setLoading = useWorkspaceStore((s) => s.setLoading);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const { isSaving } = useAutosaveDraft({
    draftId: draft?.id ?? null,
    title,
    content,
    hint
  });

  useEffect(() => {
    if (!draft) {
      setTitle("");
      setHint("");
      setContent("");
      return;
    }
    setTitle(draft.title);
    setHint(draft.hint ?? "");
    setContent(draft.content ?? "");
  }, [draft]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (pasted.length > LARGE_PASTE_THRESHOLD) {
      setPasting(true);
      setLoading(true);
      setTimeout(() => {
        setPasting(false);
        setLoading(false);
      }, 500);
    }
  };

  if (!draft) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        請從左側選擇或新增一筆收件匣草稿
      </div>
    );
  }

  return (
    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="h-10 px-3 flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-200 bg-slate-50">
        <span>收件匣草稿（自動儲存）</span>
        <span className="flex items-center gap-2">
          {pasting && <span className="text-amber-600">大型貼上處理中…</span>}
          {isSaving ? "自動儲存中…" : lastSavedAt ? `已儲存：${lastSavedAt}` : "等待編輯"}
        </span>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-auto">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">標題</label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setEditorDirty(true);
            }}
            placeholder="輸入草稿標題"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">提示/備註</label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            value={hint}
            onChange={(e) => {
              setHint(e.target.value);
              setEditorDirty(true);
            }}
            placeholder="提醒自己專案/標籤或後續動作"
          />
        </div>
        <div className="space-y-1 flex-1 flex flex-col min-h-[240px]">
          <label className="text-xs text-slate-500">內容（Markdown 支援）</label>
          <textarea
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setEditorDirty(true);
            }}
            onPaste={handlePaste}
            placeholder="開始撰寫或貼上草稿內容，系統將自動儲存"
          />
        </div>
      </div>
    </div>
  );
}
