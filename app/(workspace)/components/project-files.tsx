"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types/schema";

type ProjectFile = {
  name: string;
  size: number;
  mtimeMs: number;
};

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export default function ProjectFiles({ project }: { project: Project | null }) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canUse = Boolean(project?.id);

  const endpoint = useMemo(() => (project?.id ? `/api/projects/${project.id}/files` : null), [project?.id]);

  const load = async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const data = (await res.json()) as ProjectFile[];
      if (!res.ok) throw new Error((data as any)?.message ?? "無法載入檔案列表");
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setFiles([]);
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!endpoint) {
      setFiles([]);
      setError(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleUpload = async (file: File) => {
    if (!endpoint) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch(endpoint, { method: "POST", body: form });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.message ?? "上傳失敗");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (name: string) => {
    if (!project?.id) return;
    if (!window.confirm(`確定刪除檔案「${name}」？`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/files/${encodeURIComponent(name)}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.message ?? "刪除失敗");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-panel" style={{ padding: 0 }}>
      <div className="pm-panel-header px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--pm-border)" }}>
        <div>
          <div className="text-sm font-semibold">檔案上傳</div>
          <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
            上傳到專案的 `_files/` 資料夾，不影響提示詞掃描。
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            disabled={!canUse || busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
            className="hidden"
          />
          <button
            type="button"
            className="pm-btn pm-btn-accent h-9 px-4 text-sm disabled:opacity-60"
            disabled={!canUse || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "處理中…" : "上傳檔案"}
          </button>
          <button type="button" className="pm-btn h-9 px-4 text-sm" disabled={!canUse || busy} onClick={() => void load()}>
            重新整理
          </button>
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="mb-2 text-[11px]" style={{ color: "var(--pm-danger)" }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
            載入中…
          </div>
        ) : null}

        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.name} className="pm-row" style={{ gridTemplateColumns: "1.6fr 0.8fr 1.2fr auto" }}>
              <div className="font-semibold truncate" title={f.name}>
                {f.name}
              </div>
              <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
                {formatBytes(f.size)}
              </div>
              <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
                {new Date(f.mtimeMs).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <a
                  className="pm-btn h-8 px-3 text-[11px]"
                  href={`/api/projects/${project?.id}/files/${encodeURIComponent(f.name)}`}
                >
                  下載
                </a>
                <button
                  type="button"
                  className="pm-btn h-8 px-3 text-[11px]"
                  style={{ border: "1px solid rgba(217, 95, 95, 0.35)", background: "rgba(217, 95, 95, 0.08)", color: "var(--pm-danger)" }}
                  disabled={!canUse || busy}
                  onClick={() => void handleDelete(f.name)}
                >
                  刪除
                </button>
              </div>
            </div>
          ))}

          {!loading && files.length === 0 ? (
            <div className="rounded-[16px] px-4 py-3 text-xs" style={{ border: "1px dashed var(--pm-border)", background: "var(--pm-panel-ink)", color: "var(--pm-muted)" }}>
              尚未上傳檔案。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
