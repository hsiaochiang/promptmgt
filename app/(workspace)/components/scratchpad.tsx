"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Props {
  projects: Project[];
}

export default function Scratchpad({ projects }: Props) {
  const scratchpadContent = useWorkspaceStore((s) => s.scratchpadContent);
  const setScratchpadContent = useWorkspaceStore((s) => s.setScratchpadContent);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectOptions = projects ?? [];

  useEffect(() => {
    if (!selectedProjectId && projectOptions.length > 0) {
      setSelectedProjectId(projectOptions[0].name);
    }
  }, [projectOptions, selectedProjectId, setSelectedProjectId]);

  const kpi = useMemo(() => {
    const text = scratchpadContent ?? "";
    const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
    return { chars: text.length, lines };
  }, [scratchpadContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scratchpadContent ?? "");
    setMessage("已複製到剪貼簿");
  };

  const handleClear = () => {
    setScratchpadContent("");
  };

  const buildTitle = () => {
    const firstLine = (scratchpadContent ?? "").split(/\r?\n/)[0]?.trim() ?? "";
    return firstLine.length > 0 ? firstLine.slice(0, 50) : "Scratchpad";
  };

  const handleSavePrompt = async () => {
    if (!selectedProjectId) {
      setError("請先選擇專案");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: {
            title: buildTitle(),
            project: selectedProjectId,
            type: "其他",
            status: "草稿",
            tags: []
          },
          body: scratchpadContent ?? ""
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(payload?.message ?? "另存為提示詞失敗");
        return;
      }
      setMessage("已將剪貼簿另存為提示詞");
      if (payload?.id) {
        setSelectedPromptId(payload.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "另存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden gap-4 p-4">
      <section className="flex-[1.5] bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-indigo-600">Scratchpad</div>
            <div className="text-lg font-bold text-slate-900">快速草稿</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 px-2 rounded-lg border border-slate-300 bg-white"
              data-testid="scratchpad-project"
            >
              {projectOptions.map((p) => (
                <option key={p.id ?? p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSavePrompt}
              disabled={saving || !selectedProjectId}
              className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
              data-testid="scratchpad-save"
            >
              {saving ? "儲存中…" : "另存為提示詞"}
            </button>
          </div>
        </header>
        <textarea
          value={scratchpadContent}
          onChange={(e) => setScratchpadContent(e.target.value)}
          className="w-full min-h-[260px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-slate-400"
          placeholder="在此記錄靈感或中繼資料，之後可另存為提示詞。"
          data-testid="scratchpad-textarea"
        />
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleClear}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white"
            data-testid="scratchpad-clear"
          >
            清空
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white"
            data-testid="scratchpad-copy"
          >
            複製
          </button>
          {message ? <span className="text-emerald-600">{message}</span> : null}
          {error ? <span className="text-amber-700">{error}</span> : null}
        </div>
      </section>
      <aside className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="text-xs uppercase tracking-wide text-slate-500">KPI</div>
        <div className="flex items-center justify-between text-sm">
          <span>字數</span>
          <span data-testid="scratchpad-kpi-chars" className="font-semibold text-slate-800">
            {kpi.chars}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>行數</span>
          <span data-testid="scratchpad-kpi-lines" className="font-semibold text-slate-800">
            {kpi.lines}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          選擇專案後可直接將草稿另存為提示詞；空白時可先清空或複製後再整理。
        </div>
      </aside>
    </div>
  );
}
