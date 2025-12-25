"use client";

import React, { useState } from "react";
import { DevStateToggle, ViewState } from "../components/dev-state-toggle";
import { useMockApp } from "../providers/mock-app";

export default function ScratchpadPage() {
  const { scratchpad, projects, actions } = useMockApp();
  const [draft, setDraft] = useState(scratchpad);
  const [viewState, setViewState] = useState<ViewState>("success");
  const [targetProject, setTargetProject] = useState(projects[0]?.id ?? "");

  if (viewState === "loading") return <div className="rounded-2xl border bg-white p-4">載入中…</div>;
  if (viewState === "error") return <div className="rounded-2xl border bg-white p-4">載入失敗（dev）。</div>;

  const effectiveText = viewState === "empty" ? "" : draft;

  return (
    <div className="space-y-4" data-testid="scratchpad-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Scratchpad</div>
          <h1 className="text-2xl font-bold">快速草稿</h1>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      <textarea
        value={effectiveText}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full min-h-[260px] rounded-2xl border bg-white p-3 text-sm"
        placeholder="在此記錄靈感或中繼資料，之後可另存為提示詞。"
      />

      <div className="flex items-center gap-3">
        <button type="button" className="h-11 px-3 rounded-lg border bg-white" onClick={() => { setDraft(""); actions.setScratchpad(""); }}>
          清空
        </button>
        <button type="button" className="h-11 px-3 rounded-lg border bg-white" onClick={() => actions.copyContent(draft)} aria-label="複製草稿">
          複製
        </button>
        <select value={targetProject} onChange={(e) => setTargetProject(e.target.value)} className="h-11 px-3 rounded-lg border bg-white">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="h-11 px-3 rounded-lg border bg-emerald-600 text-white"
          onClick={() => {
            actions.setScratchpad(draft);
            actions.saveScratchpadAsPrompt({ projectId: targetProject, title: "Scratchpad" });
          }}
        >
          另存為提示詞
        </button>
      </div>
    </div>
  );
}
