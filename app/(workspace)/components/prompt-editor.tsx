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
  const [showConflict, setShowConflict] = useState(false);
  const [externalContent, setExternalContent] = useState<{ frontmatter: any; body: string; hash: string } | null>(null);

  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const extensions = useMemo(() => [markdown()], []);
  const { isSaving, error } = useAutosavePrompt({
    promptId,
    frontmatter,
    body,
    clientHash: hash,
    onSaved: (nextHash) => {
      setHash(nextHash);
      setShowConflict(false);
    }
  });

  useEffect(() => {
    if (error && error.includes("發現外部變更")) {
      setShowConflict(true);
    }
  }, [error]);

  useEffect(() => {
    setBody(initialBody);
    setHash(clientHash);
    setShowConflict(false);
  }, [initialBody, clientHash]);

  useEffect(() => {
    setFrontmatter(initialFrontmatter);
  }, [initialFrontmatter]);

  const handleLoadExternal = async () => {
    if (!promptId) return;
    const res = await fetch(`/api/prompts/${promptId}`);
    const data = await res.json();
    setBody(data.body);
    setFrontmatter(data.frontmatter);
    setHash(data.hash);
    setShowConflict(false);
    setEditorDirty(false);
  };

  const handleOverwrite = async () => {
    if (!promptId) return;
    // To overwrite, we need the latest hash from server to pass the check
    const res = await fetch(`/api/prompts/${promptId}`);
    const data = await res.json();
    setHash(data.hash);
    // useAutosavePrompt will trigger again with new hash
    setShowConflict(false);
  };

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
    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col relative">
      {showConflict && (
        <div className="absolute inset-x-0 top-0 z-10 bg-amber-50 border-b border-amber-200 p-3 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <span className="font-semibold">⚠️ 衝突警報：</span>
              <span>偵測到外部變更，自動儲存已暫停。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadExternal}
                className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded text-xs hover:bg-amber-100 transition-colors"
              >
                載入外部變更
              </button>
              <button
                onClick={handleOverwrite}
                className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors"
              >
                保留本地(覆寫)
              </button>
              <button
                onClick={() => alert("差異檢視功能開發中，請先手動對比。")}
                className="px-3 py-1 text-amber-700 text-xs hover:underline"
              >
                檢視差異
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-10 px-3 flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-200 bg-slate-50">
        <span>提示詞內容（Markdown 編輯區）</span>
        <span className="flex items-center gap-2">
          {error && !showConflict && <span className="text-amber-600">{error}</span>}
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
