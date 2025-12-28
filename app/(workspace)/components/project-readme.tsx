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
    <div className="border border-slate-200 bg-white rounded-lg p-3 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-700">專案說明 README</div>
          <div className="text-[11px] text-slate-500">{project?.name ?? "未選擇專案"}</div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              className={`px-2 py-1 rounded-full text-xs ${view === "edit" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}
              onClick={() => setView("edit")}
            >
              編輯
            </button>
            <button
              className={`px-2 py-1 rounded-full text-xs ${view === "preview" ? "bg-slate-900 text-white" : "bg-white border border-slate-300"}`}
              onClick={() => setView("preview")}
            >
              預覽
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEdit || saving}
            className="px-3 py-1 rounded-full bg-slate-900 text-white disabled:opacity-60"
          >
            {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      </div>
      {error ? (
        <div className="text-[11px] text-amber-700">
          {error}
          {conflictDetails?.currentMtime ? (
            <span className="ml-1 text-amber-600">
              （伺服端版本時間：{formatForUI_MMDD_HHmm(new Date(conflictDetails.currentMtime).toISOString())}）
            </span>
          ) : null}
          {conflictDetails?.currentHash ? <span className="ml-1 text-amber-600">（hash：{conflictDetails.currentHash}）</span> : null}
        </div>
      ) : null}
      {conflictDetails ? (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex flex-wrap gap-2 items-center">
          <span>偵測到 409 衝突，請選擇處理方式：</span>
          <button
            type="button"
            className="px-2 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-100"
            onClick={handleReload}
          >
            重新載入外部版本
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-100"
            onClick={handleSaveCopy}
          >
            另存副本 (.md)
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700"
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
          className="w-full min-h-[180px] rounded border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-400 disabled:bg-slate-50"
          placeholder={canEdit ? "撰寫專案說明…" : "請先選擇專案"}
        />
      ) : (
        <div className="border rounded border-slate-200 p-3 bg-slate-50">
          <MarkdownPreview content={content} />
        </div>
      )}
      <div className="text-[11px] text-slate-500 flex items-center justify-between">
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
