"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types/schema";
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
}

export default function ProjectReadme({ project, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [hash, setHash] = useState<string | null>(null);
  const [mtimeMs, setMtimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = Boolean(project?.id);

  useEffect(() => {
    if (!project?.id) {
      setContent("");
      setHash(null);
      setMtimeMs(null);
      setError(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${project.id}/readme`);
        if (!res.ok) throw new Error("無法讀取專案說明");
        const data = (await res.json()) as ReadmePayload;
        setContent(data.content ?? "");
        setHash(data.hash ?? null);
        setMtimeMs(data.mtimeMs ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "讀取失敗");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [project?.id]);

  const handleSave = async () => {
    if (!project?.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/readme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, expectedHash: hash, expectedMtime: mtimeMs })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as any));
        const message = (payload as any)?.message ?? "儲存專案說明失敗";
        throw new Error(message);
      }
      const data = (await res.json()) as { hash: string; mtimeMs: number };
      setHash(data.hash);
      setMtimeMs(data.mtimeMs);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-200 bg-white rounded-lg p-3 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-700">專案說明 README</div>
          <div className="text-[11px] text-slate-500">{project?.name ?? "未選擇專案"}</div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
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
      {error ? <div className="text-[11px] text-amber-700">{error}</div> : null}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!canEdit || loading}
        className="w-full min-h-[180px] rounded border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-400 disabled:bg-slate-50"
        placeholder={canEdit ? "撰寫專案說明…" : "請先選擇專案"}
      />
      <div className="text-[11px] text-slate-500 flex items-center justify-between">
        <span>{loading ? "載入中…" : "已載入"}</span>
        {mtimeMs ? <span>更新：{formatForUI_MMDD_HHmm(new Date(mtimeMs).toISOString())}</span> : <span>尚未儲存</span>}
      </div>
    </div>
  );
}
