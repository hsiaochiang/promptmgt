"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { markdown } from "@codemirror/lang-markdown";
import { buildFullContent } from "@/lib/utils/clipboard";
import { toIsoWithOffset } from "@/lib/utils/date";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { useAutosavePrompt } from "../hooks/useAutosavePrompt";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import ConflictDialog from "./conflict-dialog";
import MarkdownPreview from "./markdown-preview";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface Props {
  promptId: string | null;
  initialFrontmatter: PromptFrontmatter | null;
  initialBody: string;
  clientHash: string | null;
  initialMtimeMs?: number | null;
  initialDamaged?: boolean;
  initialParseErrorCode?: string | null;
  initialParseErrorMessage?: string | null;
  insertText?: string | null;
  onInserted?: () => void;
  onBodyChange?: (body: string) => void;
  onFrontmatterChange?: (frontmatter: PromptFrontmatter | null) => void;
  onDamagedChange?: (damaged: boolean) => void;
  autosaveDelay?: number;
}

export default function PromptEditor({
  promptId,
  initialFrontmatter,
  initialBody,
  clientHash,
  initialMtimeMs = null,
  initialDamaged = false,
  initialParseErrorCode = null,
  initialParseErrorMessage = null,
  insertText,
  onInserted,
  onBodyChange,
  onFrontmatterChange,
  onDamagedChange,
  autosaveDelay
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [frontmatter, setFrontmatter] = useState<PromptFrontmatter | null>(initialFrontmatter);
  const [hash, setHash] = useState<string | null>(clientHash);
  const [mtimeMs, setMtimeMs] = useState<number | null>(initialMtimeMs);
  const [conflictHash, setConflictHash] = useState<string | null>(null);
  const [conflictMtime, setConflictMtime] = useState<number | null>(null);
  const [conflictDetectedAt, setConflictDetectedAt] = useState<number | null>(null);
  const [conflictNotifyBy, setConflictNotifyBy] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [externalPreview, setExternalPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [damaged, setDamaged] = useState(initialDamaged);
  const [parseErrorCode, setParseErrorCode] = useState<string | null>(initialParseErrorCode);
  const [parseErrorMessage, setParseErrorMessage] = useState<string | null>(initialParseErrorMessage);
  const [view, setView] = useState<"edit" | "preview">("edit");

  const recordTelemetry = async (event: string) => {
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, timestamp: new Date().toISOString() })
      });
    } catch {
      // ignore telemetry errors
    }
  };

  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const extensions = useMemo(() => [markdown()], []);
  const { isSaving, error } = useAutosavePrompt({
    promptId,
    frontmatter,
    body,
    clientHash: hash,
    clientMtime: mtimeMs ?? undefined,
    delay: autosaveDelay ?? 2000,
    disabled: damaged,
    onSaved: (nextHash, nextMtime) => {
      setHash(nextHash);
      if (nextMtime) setMtimeMs(nextMtime);
      setConflictHash(null);
      setConflictMtime(null);
      setConflictDetectedAt(null);
      setConflictNotifyBy(null);
      setShowConflictDialog(false);
    },
    onConflict: (serverHash, serverMtime) => {
      setConflictHash(serverHash);
      setConflictMtime(serverMtime ?? null);
      const detectedAt = Date.now();
      setConflictDetectedAt(detectedAt);
      setConflictNotifyBy(new Date(detectedAt + 5000).toISOString());
      // Do not show immediately, let the effect handle it
      recordTelemetry("conflict_detected");
    }
  });

  useEffect(() => {
    setBody(initialBody);
    setHash(clientHash);
    setMtimeMs(initialMtimeMs ?? null);
    setConflictHash(null);
    setConflictMtime(null);
    setConflictDetectedAt(null);
    setConflictNotifyBy(null);
    setShowConflictDialog(false);
    setExternalPreview(null);
    setDamaged(initialDamaged);
    setParseErrorCode(initialParseErrorCode);
    setParseErrorMessage(initialParseErrorMessage);
    onDamagedChange?.(initialDamaged);
  }, [initialBody, clientHash, initialMtimeMs, initialDamaged, initialParseErrorCode, initialParseErrorMessage, onDamagedChange]);

  useEffect(() => {
    setFrontmatter(initialFrontmatter);
    onFrontmatterChange?.(initialFrontmatter);
  }, [initialFrontmatter, onFrontmatterChange]);

  useEffect(() => {
    if (!conflictNotifyBy || showConflictDialog) return;
    const deadline = new Date(conflictNotifyBy).getTime();
    const delay = Math.max(0, Math.min(5000, deadline - Date.now()));
    const timer = window.setTimeout(() => {
        setShowConflictDialog(true);
        recordTelemetry("conflict_dialog_shown");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [conflictNotifyBy, showConflictDialog]);

  useEffect(() => {
    if (!insertText) return;
    setBody((prev) => {
      const next = `${(prev ?? "").length ? `${prev}\n` : ""}${insertText}`;
      // Defer parent updates to avoid setState during render warnings
      setTimeout(() => {
        onBodyChange?.(next);
        setEditorDirty(true);
        onInserted?.();
      }, 0);
      return next;
    });
  }, [insertText, onInserted, onBodyChange, setEditorDirty]);

  const buildRepairFrontmatter = (): PromptFrontmatter => {
    const now = toIsoWithOffset();
    if (frontmatter) {
      return {
        ...frontmatter,
        title: frontmatter.title || "untitled",
        project: frontmatter.project || "unspecified",
        updatedAt: frontmatter.updatedAt ?? now,
        createdAt: frontmatter.createdAt ?? now,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : []
      };
    }
    return {
      title: "untitled",
      project: "unspecified",
      type: "其他",
      status: "草稿",
      model: "",
      tags: [],
      updatedAt: now,
      createdAt: now
    };
  };

  const handleRepair = async () => {
    if (!promptId) return;
    const safeFrontmatter = buildRepairFrontmatter();
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter: safeFrontmatter, body, clientHash: hash, clientMtime: mtimeMs ?? undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setParseErrorMessage(data?.message ?? "修復失敗，請稍後再試。");
        setParseErrorCode(data?.code ?? "frontmatter_repair_failed");
        return;
      }
      const nextFrontmatter = {
        ...safeFrontmatter,
        updatedAt: data.updatedAt ?? safeFrontmatter.updatedAt
      };
      setFrontmatter(nextFrontmatter);
      onFrontmatterChange?.(nextFrontmatter);
      setHash(data.hash ?? hash);
      if (data.mtimeMs) setMtimeMs(data.mtimeMs);
      setDamaged(false);
      setParseErrorCode(null);
      setParseErrorMessage(null);
      onDamagedChange?.(false);
      setEditorDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const reloadExternal = async () => {
    if (!promptId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const data = await res.json();
      setFrontmatter(data.frontmatter);
      onFrontmatterChange?.(data.frontmatter);
      setBody(data.body);
      setHash(data.hash);
      if (data.mtimeMs) setMtimeMs(data.mtimeMs);
      onBodyChange?.(data.body);
      setDamaged(!!data.damaged);
      setParseErrorCode(data.errorCode ?? null);
      setParseErrorMessage(data.errorMessage ?? null);
      onDamagedChange?.(!!data.damaged);
      setConflictHash(null);
      setExternalPreview(null);
      setEditorDirty(false);
      setShowConflictDialog(false);
      recordTelemetry("conflict_resolved_external");
    } finally {
      setBusy(false);
    }
  };

  const overwriteWithLocal = async () => {
    if (!promptId || !frontmatter || !conflictHash) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const current = await res.json();
      const forceHash = current?.hash ?? conflictHash;
      const saveRes = await fetch(`/api/prompts/${promptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter, body, clientHash: forceHash })
      });
      const data = await saveRes.json();
      if (data.hash) {
        setHash(data.hash);
        if (data.mtimeMs) setMtimeMs(data.mtimeMs);
        setDamaged(false);
        setParseErrorCode(null);
        setParseErrorMessage(null);
        onDamagedChange?.(false);
        setConflictHash(null);
        setExternalPreview(null);
        setEditorDirty(false);
        setShowConflictDialog(false);
        recordTelemetry("conflict_resolved_local");
      }
    } finally {
      setBusy(false);
    }
  };

  const saveAsCopy = async () => {
    if (!frontmatter) return;
    setBusy(true);
    try {
      const now = toIsoWithOffset();
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: { ...frontmatter, title: `${frontmatter.title} 副本`, updatedAt: now, createdAt: frontmatter.createdAt ?? now },
          body
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHash(data.hash ?? null);
        setMtimeMs(data.mtimeMs ?? null);
        setFrontmatter(data.frontmatter ?? frontmatter);
        onFrontmatterChange?.(data.frontmatter ?? frontmatter);
        if (data.id) setSelectedPromptId(data.id);
        setConflictHash(null);
        setExternalPreview(null);
        setEditorDirty(false);
        setShowConflictDialog(false);
        recordTelemetry("conflict_save_as_copy");
      }
    } finally {
      setBusy(false);
    }
  };

  const previewExternal = async () => {
    if (!promptId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const data = await res.json();
      if (data.frontmatter) {
        setExternalPreview(buildFullContent(data.frontmatter, data.body ?? ""));
      } else {
        setExternalPreview(data.body ?? "");
      }
      recordTelemetry("conflict_view_diff");
    } finally {
      setBusy(false);
    }
  };

  if (!promptId) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-sm rounded-[16px]"
        style={{ color: "var(--pm-muted)", background: "var(--pm-panel-ink)", border: "1px dashed var(--pm-border)" }}
      >
        請從列表選擇提示詞
      </div>
    );
  }

  return (
    <div className="flex-1 pm-panel overflow-hidden flex flex-col relative">
      <ConflictDialog
        open={showConflictDialog}
        localDate={mtimeMs}
        externalDate={conflictMtime}
        diffContent={externalPreview}
        isBusy={busy}
        onLoadExternal={reloadExternal}
        onKeepLocal={overwriteWithLocal}
        onViewDiff={() => {
          if (externalPreview) setExternalPreview(null);
          else previewExternal();
        }}
      />
      {damaged && (
        <div
          className="p-3 flex items-center justify-between gap-4"
          style={{ background: "rgba(217, 95, 95, 0.10)", borderBottom: "1px solid rgba(217, 95, 95, 0.25)" }}
        >
          <div className="text-sm flex flex-col gap-1" style={{ color: "#7a2b2b" }}>
            <span className="font-semibold">需修復：Frontmatter 損壞</span>
            <span className="text-xs" style={{ color: "#8f3a3a" }}>
              {parseErrorMessage ?? "Frontmatter YAML 損壞，已切換為純文字模式。"}
              {parseErrorCode ? `（${parseErrorCode}）` : ""}
            </span>
          </div>
          <button
            onClick={handleRepair}
            disabled={busy}
            className="pm-btn pm-btn-primary h-8 px-3 text-[11px] disabled:opacity-60"
          >
            一鍵修復並保存
          </button>
        </div>
      )}
      {conflictHash && !showConflictDialog && (
        <div
          className="absolute inset-x-0 top-0 z-10 p-3 shadow-sm animate-in fade-in slide-in-from-top-1"
          style={{ top: damaged ? 60 : 0 }}
        >
          <div
            className="rounded-[14px] p-3"
            style={{ background: "rgba(212, 163, 115, 0.18)", border: "1px solid rgba(212, 163, 115, 0.35)" }}
          >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#8a5a2a" }}>
              <span className="font-semibold">衝突警報：</span>
              <span>偵測到外部變更，自動儲存已暫停。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reloadExternal}
                disabled={busy}
                data-testid="conflict-load-external"
                className="pm-btn h-8 px-3 text-[11px] disabled:opacity-60"
              >
                載入外部變更
              </button>
              <button
                onClick={overwriteWithLocal}
                disabled={busy}
                data-testid="conflict-keep-local"
                className="pm-btn pm-btn-primary h-8 px-3 text-[11px] disabled:opacity-60"
              >
                保留本地(覆寫)
              </button>
              <button
                onClick={saveAsCopy}
                disabled={busy}
                data-testid="conflict-save-copy"
                className="pm-btn h-8 px-3 text-[11px] disabled:opacity-60"
              >
                另存副本
              </button>
              <button
                onClick={previewExternal}
                disabled={busy}
                className="pm-btn h-8 px-3 text-[11px] disabled:opacity-60"
              >
                檢視差異
              </button>
            </div>
          </div>
          {externalPreview && (
            <div
              className="mt-2 text-[11px] rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap"
              style={{ color: "#5a3b1f", background: "#fff", border: "1px solid rgba(212, 163, 115, 0.35)" }}
            >
              {externalPreview}
            </div>
          )}
          </div>
        </div>
      )}
      <div className="h-10 px-3 flex items-center justify-between text-[12px] pm-panel-header">
        <div className="flex items-center gap-2">
          <button
            className={`pm-btn h-7 px-3 text-[11px] ${view === "edit" ? "pm-btn-primary" : ""}`}
            onClick={() => setView("edit")}
          >
            編輯
          </button>
          <button
            className={`pm-btn h-7 px-3 text-[11px] ${view === "preview" ? "pm-btn-primary" : ""}`}
            onClick={() => setView("preview")}
          >
            預覽
          </button>
        </div>
        <span className="flex items-center gap-2" style={{ color: "var(--pm-muted)" }}>
          {error && !conflictHash && <span style={{ color: "#8a5a2a" }}>{error}</span>}
          {isSaving ? "自動儲存中…" : lastSavedAt ? `已儲存：${lastSavedAt}` : "等待編輯"}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {view === "edit" ? (
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
        ) : (
          <div className="p-4">
            <MarkdownPreview content={body} />
          </div>
        )}
      </div>
    </div>
  );
}
