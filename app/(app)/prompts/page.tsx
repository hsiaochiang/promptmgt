"use client";

import React, { useState } from "react";
import { DevStateToggle, ViewState } from "../components/dev-state-toggle";
import { PromptListPanel } from "../components/prompt-list-panel";
import { useMockApp } from "../providers/mock-app";

export default function PromptsPage() {
  const { prompts, projects, actions } = useMockApp();
  const [viewState, setViewState] = useState<ViewState>("success");

  return (
    <div className="space-y-6" data-testid="prompts-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Prompts</div>
          <h1 className="text-2xl font-bold">提示詞列表</h1>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      <PromptListPanel
        prompts={prompts}
        projects={projects}
        viewState={viewState}
        onViewStateChange={setViewState}
        onSelect={(id) => actions.copyContent(`跳轉前複製：${id}`)}
        onCopy={(prompt) => actions.copyContent(prompt.body)}
        onArchive={(id) => actions.archivePrompt(id)}
        onMove={(id, projectId) => actions.movePrompt(id, projectId)}
      />
    </div>
  );
}
