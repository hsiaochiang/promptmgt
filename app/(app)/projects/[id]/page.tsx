"use client";

import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { DataTable } from "../../components/data-table";
import { DevStateToggle, ViewState } from "../../components/dev-state-toggle";
import { ProgressLogList } from "../../components/progress-log-list";
import { useMockApp } from "../../providers/mock-app";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id as string;
  const { projects, prompts, actions } = useMockApp();
  const project = projects.find((p) => p.id === projectId);
  const [viewState, setViewState] = useState<ViewState>("success");

  const projectPrompts = useMemo(() => prompts.filter((p) => p.projectId === projectId && !p.archived), [prompts, projectId]);

  if (!project) {
    return <div className="rounded-2xl border bg-white p-4">找不到專案。</div>;
  }

  return (
    <div className="space-y-6" data-testid="project-detail-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Project Detail</div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="text-xs text-slate-500">規則：進度預設唯讀；按編輯後才可改，取消會復原；link 唯讀時只顯示「連結」。</div>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold">專案名稱</div>
            <input
              value={project.name}
              onChange={(e) => actions.updateProject(project.id, { name: e.target.value })}
              className="h-11 px-3 rounded-lg border bg-white"
            />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold">狀態</div>
            <select
              value={project.status}
              onChange={(e) => actions.updateProject(project.id, { status: e.target.value })}
              className="h-11 px-3 rounded-lg border bg-white"
            >
              <option value="進行中">進行中</option>
              <option value="已歸檔">已歸檔</option>
            </select>
          </div>
          <div className="flex items-end justify-end gap-2">
            <button type="button" className="h-11 px-3 rounded-lg border bg-white" onClick={() => actions.updateProject(project.id, { status: "進行中", archived: false })}>
              標記進行中
            </button>
            <button type="button" className="h-11 px-3 rounded-lg border bg-amber-500 text-white" onClick={() => actions.archiveProject(project.id)}>
              歸檔
            </button>
          </div>
        </div>
      </div>

      <ProgressLogList
        logs={project.progressLogs ?? []}
        onUpdate={(logId, patch) => actions.updateProgressLog(project.id, logId, patch)}
        onAdd={() => actions.addProgressLog(project.id)}
        viewState={viewState}
        onViewStateChange={setViewState}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">專案下的提示詞</div>
          <span className="text-xs text-slate-500">支援 copy/move，Archive 會標記並保留列表</span>
        </div>
        <DataTable
          columns={[
            { key: "title", header: "標題" },
            { key: "status", header: "狀態" },
            {
              key: "tags",
              header: "標籤",
              render: (row) => (row as any).tags.join(", ") || "—"
            },
            {
              key: "ops",
              header: "操作",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <button type="button" className="px-3 py-1 rounded-lg border bg-white text-sm" onClick={() => actions.copyContent((row as any).body)}>
                    複製
                  </button>
                  <button type="button" className="px-3 py-1 rounded-lg border bg-white text-sm" onClick={() => actions.movePrompt((row as any).id, project.id)}>
                    留在此專案
                  </button>
                  <button type="button" className="px-3 py-1 rounded-lg border bg-amber-500 text-white text-sm" onClick={() => actions.archivePrompt((row as any).id)}>
                    歸檔
                  </button>
                </div>
              )
            }
          ]}
          data={viewState === "empty" ? [] : projectPrompts}
          emptyText={viewState === "empty" ? "空狀態（dev）" : "尚無提示詞"}
        />
      </div>
    </div>
  );
}
