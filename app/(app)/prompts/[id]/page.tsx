"use client";

import { useParams } from "next/navigation";
import React, { useState } from "react";
import { DevStateToggle, ViewState } from "../../components/dev-state-toggle";
import { PromptEditor } from "../../components/prompt-editor";
import { useMockApp } from "../../providers/mock-app";

export default function PromptDetailPage() {
  const params = useParams<{ id: string }>();
  const promptId = params?.id as string;
  const { prompts, projects, actions } = useMockApp();
  const prompt = prompts.find((p) => p.id === promptId);
  const [viewState, setViewState] = useState<ViewState>("success");

  if (!prompt) return <div className="rounded-2xl border bg-white p-4">找不到提示詞。</div>;

  if (viewState === "loading") return <div className="rounded-2xl border bg-white p-4">載入中…</div>;
  if (viewState === "error") return <div className="rounded-2xl border bg-white p-4">載入失敗（dev）。</div>;
  if (viewState === "empty") return <div className="rounded-2xl border bg-white p-4">空狀態（dev）。</div>;

  return (
    <div className="space-y-4" data-testid="prompt-detail-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Prompt Detail</div>
          <h1 className="text-2xl font-bold">{prompt.title}</h1>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      <PromptEditor
        prompt={prompt}
        projectOptions={projects.map((p) => ({ id: p.id, name: p.name }))}
        onChange={(patch) => actions.updatePrompt(prompt.id, patch)}
        onCopy={(text) => actions.copyContent(text)}
        onArchive={() => actions.archivePrompt(prompt.id)}
        onMove={(projectId) => actions.movePrompt(prompt.id, projectId)}
      />
    </div>
  );
}
