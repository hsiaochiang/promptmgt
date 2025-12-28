"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { Project } from "@/lib/types/schema";
import MarkdownPreview from "./markdown-preview";
import { formatForUI_MMDD_HHmm } from "@/lib/utils/date";

interface Props {
  project: Project | null;
  onSaved?: () => void;
}

interface ReadmePayload {
  content: string;
  path: string;
  hash: string;
  mtimeMs: number;
  updatedAt?: string;
}

export default function ProjectReadme({ project, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [mtimeMs, setMtimeMs] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictDetails, setConflictDetails] = useState<{ currentHash?: string; currentMtime?: number } | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");

  const canEdit = Boolean(project?.id);

  const load = useCallback(async () => {
    if (!project?.id) {
      setContent("");
      setHash(null);
      setMtimeMs(null);
      setUpdatedAt(null);
      setError(null);
      setConflictDetails(null);
      return;
    }
    setLoading(true);
    setError(null);
    setConflictDetails(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/readme`);
      const data = (await res.json()) as ReadmePayload;
      if (!res.ok) throw new Error((data as any)?.message ?? "無法讀取專案說明");
      setContent(data.content ?? "");
      setHash(data.hash ?? null);
      setMtimeMs(data.mtimeMs ?? null);
      setUpdatedAt(data.updatedAt ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取失敗");
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (!project?.id) {
      setContent("");
      setHash(null);
      setMtimeMs(null);
      setUpdatedAt(null);
      setError(null);
      setConflictDetails(null);
      return;
    }
    load();
  }, [project?.id, load]);

  const handleSave = async () => {
    if (!project?.id) return;
    setSaving(true);
    setError(null);
    setConflictDetails(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/readme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, expectedHash: hash, expectedMtime: mtimeMs })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setConflictDetails(payload?.details ?? null);
        const message = (payload as any)?.message ?? "儲存專案說明失敗";
        throw new Error(message);
      }
      const data = payload as { hash: string; mtimeMs: number; updatedAt?: string };
      setHash(data.hash);
      setMtimeMs(data.mtimeMs);
      setUpdatedAt(data.updatedAt ?? null);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => load();

  const handleOverwrite = () => {
    if (!conflictDetails) return;
    setHash(conflictDetails.currentHash ?? hash);
    setMtimeMs(conflictDetails.currentMtime ?? mtimeMs);
    handleSave();
  };

  const handleSaveCopy = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project?.name ?? "README")}-副本.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pm-panel p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold" style={{ color: "var(--pm-text)" }}>
            專案說明 README
          </div>
          <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
            {project?.name ?? "未選擇專案"}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              className={`pm-btn h-7 px-3 text-xs ${view === "edit" ? "pm-btn-primary" : ""}`}
              onClick={() => setView("edit")}
            >
              編輯
            </button>
            <button
              className={`pm-btn h-7 px-3 text-xs ${view === "preview" ? "pm-btn-primary" : ""}`}
              onClick={() => setView("preview")}
            >
              預覽
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || saving}
            className="pm-btn pm-btn-primary h-7 px-3 text-xs disabled:opacity-60"
          >
            {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      </div>
      {error ? (
        <div className="text-[11px]" style={{ color: "#8a5a2a" }}>
          {error}
          {conflictDetails?.currentMtime ? (
            <span className="ml-1" style={{ color: "#8a5a2a" }}>
              （伺服端版本時間：{formatForUI_MMDD_HHmm(new Date(conflictDetails.currentMtime).toISOString())}）
            </span>
          ) : null}
          {conflictDetails?.currentHash ? (
            <span className="ml-1" style={{ color: "#8a5a2a" }}>
              （hash：{conflictDetails.currentHash}）
            </span>
          ) : null}
        </div>
      ) : null}
      {conflictDetails ? (
        <div
          className="text-[11px] rounded px-3 py-2 flex flex-wrap gap-2 items-center"
          style={{ color: "#5a3b1f", background: "rgba(212, 163, 115, 0.18)", border: "1px solid rgba(212, 163, 115, 0.35)" }}
        >
          <span>偵測到 409 衝突，請選擇處理方式：</span>
          <button
            type="button"
            className="pm-btn h-7 px-3 text-[11px]"
            onClick={handleReload}
          >
            重新載入外部版本
          </button>
          <button
            type="button"
            className="pm-btn h-7 px-3 text-[11px]"
            onClick={handleSaveCopy}
          >
            另存副本 (.md)
          </button>
          <button
            type="button"
            className="pm-btn pm-btn-accent h-7 px-3 text-[11px]"
            onClick={handleOverwrite}
          >
            強制覆寫
          </button>
        </div>
      ) : null}
      {view === "edit" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canEdit || loading}
          className="w-full min-h-[180px] rounded-[14px] px-3 py-2 text-sm font-mono focus:outline-none"
          style={{
            border: "1px solid var(--pm-border)",
            background: "#fff",
            color: "var(--pm-text)"
          }}
          placeholder={canEdit ? "撰寫專案說明…" : "請先選擇專案"}
        />
      ) : (
        <div
          className="rounded-[14px] p-3"
          style={{ border: "1px solid var(--pm-border)", background: "var(--pm-panel-ink)" }}
        >
          <MarkdownPreview content={content} />
        </div>
      )}
      <div className="text-[11px] flex items-center justify-between" style={{ color: "var(--pm-muted)" }}>
        <span>{loading ? "載入中…" : "已載入"}</span>
        {updatedAt
          ? <span>更新：{formatForUI_MMDD_HHmm(updatedAt)}</span>
          : mtimeMs
            ? <span>更新：{formatForUI_MMDD_HHmm(new Date(mtimeMs).toISOString())}</span>
            : <span>尚未儲存</span>}
      </div>
    </div>
  );
}
