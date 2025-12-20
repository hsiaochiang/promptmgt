"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAutosavePrompt } from "../hooks/useAutosavePrompt";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface Props {
  promptId: string | null;
  initialFrontmatter: PromptFrontmatter | null;
  initialBody: string;
  clientHash: string | null;
  insertText?: string | null;
  onInserted?: () => void;
  onBodyChange?: (body: string) => void;
}

export default function PromptEditor({
  promptId,
  initialFrontmatter,
  initialBody,
  clientHash,
  insertText,
  onInserted,
  onBodyChange
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [frontmatter, setFrontmatter] = useState<PromptFrontmatter | null>(initialFrontmatter);
  const [hash, setHash] = useState<string | null>(clientHash);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const extensions = useMemo(() => [markdown()], []);
  const { isSaving, error } = useAutosavePrompt({
    promptId,
    frontmatter,
    body,
    clientHash: hash,
    onSaved: (nextHash) => setHash(nextHash)
  });

  useEffect(() => {
    setBody(initialBody);
    setHash(clientHash);
  }, [initialBody, clientHash]);

  useEffect(() => {
    setFrontmatter(initialFrontmatter);
  }, [initialFrontmatter]);

  useEffect(() => {
    if (!insertText) return;
    setBody((prev) => {
      const prefix = prev ? `${prev}\n` : "";
      const next = `${prefix}${insertText}`;
      onBodyChange?.(next);
      return next;
    });
    setEditorDirty(true);
    onInserted?.();
  }, [insertText, onInserted, onBodyChange, setEditorDirty]);

  if (!promptId || !frontmatter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        請從列表選擇提示詞
      </div>
    );
  }

  return (
    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="h-10 px-3 flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-200 bg-slate-50">
        <span>提示詞內容（Markdown 編輯區）</span>
        <span className="flex items-center gap-2">
          {error && <span className="text-amber-600">{error}</span>}
          {isSaving ? "自動儲存中…" : lastSavedAt ? `已儲存：${lastSavedAt}` : "等待編輯"}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={body}
          height="100%"
          extensions={extensions}
          onChange={(val) => {
            setBody(val);
            onBodyChange?.(val);
            setEditorDirty(true);
          }}
          theme="light"
        />
      </div>
    </div>
  );
}
