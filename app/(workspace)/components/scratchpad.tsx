"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import ConfirmModal from "./confirm-modal";

interface Props {
  projects: Project[];
  onScheduleUndo?: (message: string, commit: () => Promise<void>, onUndo?: () => void) => void;
}

export default function Scratchpad({ projects, onScheduleUndo }: Props) {
  const scratchpadContent = useWorkspaceStore((s) => s.scratchpadContent);
  const setScratchpadContent = useWorkspaceStore((s) => s.setScratchpadContent);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

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

  const schedule = onScheduleUndo ?? ((_, c, u) => {
    u?.();
    return c();
  });

  const handleClear = () => {
    const backup = scratchpadContent;
    setScratchpadContent("");
    schedule("已清空剪貼簿，5 秒內可撤銷", async () => {}, () => setScratchpadContent(backup ?? ""));
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
    <div className="flex flex-1 overflow-hidden gap-6">
      <section className="pm-panel flex-[1.5] p-6 flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--pm-brand-strong)" }}>
              Scratchpad
            </div>
            <div className="text-lg font-bold">快速草稿</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-9 px-3 rounded-full border bg-[color:var(--pm-panel)]"
              style={{ borderColor: "var(--pm-border)" }}
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
              className="pm-btn pm-btn-primary h-9 px-4 text-sm disabled:opacity-60"
              data-testid="scratchpad-save"
            >
              {saving ? "儲存中…" : "另存為提示詞"}
            </button>
          </div>
        </header>
        <textarea
          value={scratchpadContent}
          onChange={(e) => setScratchpadContent(e.target.value)}
          className="w-full min-h-[260px] flex-1 rounded-[14px] border bg-[color:var(--pm-panel)] px-4 py-3 text-sm font-mono focus:outline-none"
          style={{ borderColor: "var(--pm-border)" }}
          placeholder="在此記錄靈感或中繼資料，之後可另存為提示詞。"
          data-testid="scratchpad-textarea"
        />
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="pm-btn h-9 px-4 text-sm"
            data-testid="scratchpad-clear"
          >
            清空
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="pm-btn h-9 px-4 text-sm"
            data-testid="scratchpad-copy"
          >
            複製
          </button>
          {message ? <span style={{ color: "var(--pm-brand-strong)" }}>{message}</span> : null}
          {error ? <span style={{ color: "var(--pm-danger)" }}>{error}</span> : null}
        </div>
      </section>
      <aside className="pm-panel flex-1 p-6 flex flex-col gap-4">
        <div className="text-xs uppercase tracking-wide" style={{ color: "var(--pm-muted)" }}>
          KPI
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>字數</span>
          <span data-testid="scratchpad-kpi-chars" className="font-semibold">
            {kpi.chars}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>行數</span>
          <span data-testid="scratchpad-kpi-lines" className="font-semibold">
            {kpi.lines}
          </span>
        </div>
        <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
          選擇專案後可直接將草稿另存為提示詞；空白時可先清空或複製後再整理。
        </div>
      </aside>
      <ConfirmModal
        open={confirmClear}
        title="確認清空剪貼簿"
        description="清空後 5 秒內可 Undo。"
        confirmText="清空"
        cancelText="取消"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          handleClear();
        }}
      />
    </div>
  );
}
