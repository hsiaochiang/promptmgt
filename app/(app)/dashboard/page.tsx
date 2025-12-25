"use client";

import React, { useMemo, useState } from "react";
import { DevStateToggle, ViewState } from "../components/dev-state-toggle";
import { DataTable } from "../components/data-table";
import { useMockApp } from "../providers/mock-app";

export default function DashboardPage() {
  const { projects, prompts } = useMockApp();
  const [viewState, setViewState] = useState<ViewState>("success");

  const cards = useMemo(
    () => [
      { label: "專案", value: projects.length },
      { label: "提示詞", value: prompts.length },
      { label: "進行中", value: projects.filter((p) => p.status === "進行中").length },
      { label: "已歸檔", value: projects.filter((p) => p.archived).length }
    ],
    [projects, prompts]
  );

  const recentPrompts = useMemo(() => prompts.slice(0, 5), [prompts]);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Dashboard</div>
          <h1 className="text-2xl font-bold">Overview</h1>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      {viewState === "loading" ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">載入中（dev）。</div>
      ) : viewState === "error" ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-rose-600">載入失敗（dev）。</div>
      ) : null}

      {viewState !== "loading" && viewState !== "error" ? (
        <>
          <div className="grid grid-cols-4 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border bg-white p-4">
                <div className="text-xs text-slate-500">{c.label}</div>
                <div className="text-2xl font-bold">{viewState === "empty" ? 0 : c.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">最新提示詞</div>
              <span className="text-xs text-slate-500">Top 3 flows: 專案→提示詞→拷貝/移動</span>
            </div>
            <DataTable
              columns={[
                { key: "title", header: "標題" },
                { key: "project", header: "專案", render: (row) => projects.find((p) => p.id === (row as any).projectId)?.name ?? "—" },
                { key: "status", header: "狀態" },
                { key: "tags", header: "標籤", render: (row) => (row as any).tags.join(", ") || "—" }
              ]}
              data={viewState === "empty" ? [] : recentPrompts}
              emptyText="尚無提示詞"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
