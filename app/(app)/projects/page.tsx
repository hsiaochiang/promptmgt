"use client";

import React, { useMemo, useState } from "react";
import { DataTable } from "../components/data-table";
import { DevStateToggle, ViewState } from "../components/dev-state-toggle";
import { useMockApp } from "../providers/mock-app";

export default function ProjectsPage() {
  const { projects, actions } = useMockApp();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("進行中");
  const [viewState, setViewState] = useState<ViewState>("success");

  const visibleProjects = useMemo(() => (viewState === "empty" ? [] : projects), [projects, viewState]);

  return (
    <div className="space-y-6" data-testid="projects-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-indigo-600 font-semibold">Projects</div>
          <h1 className="text-2xl font-bold">專案列表</h1>
        </div>
        <DevStateToggle value={viewState} onChange={setViewState} />
      </div>

      {viewState === "loading" ? <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">載入中…</div> : null}
      {viewState === "error" ? <div className="rounded-2xl border bg-white p-4 text-sm text-rose-600">載入失敗（dev 控制）。</div> : null}

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <div className="font-semibold">新增專案</div>
        <div className="grid grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="專案名稱" className="h-11 px-3 rounded-lg border bg-white" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 px-3 rounded-lg border bg-white">
            <option value="進行中">進行中</option>
            <option value="已歸檔">已歸檔</option>
          </select>
          <button
            type="button"
            className="h-11 px-3 rounded-lg border bg-emerald-600 text-white"
            onClick={() => {
              actions.createProject({ name, status });
              setName("");
            }}
          >
            新增
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "名稱" },
          { key: "status", header: "狀態" },
          {
            key: "logs",
            header: "進度數",
            render: (row) => (row as any).progressLogs?.length ?? 0
          },
          {
            key: "ops",
            header: "操作",
            render: (row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border bg-white text-sm"
                  onClick={() => actions.updateProject((row as any).id, { status: "進行中", archived: false })}
                >
                  標記進行中
                </button>
                <button type="button" className="px-3 py-1 rounded-lg border bg-amber-500 text-white text-sm" onClick={() => actions.archiveProject((row as any).id)}>
                  歸檔
                </button>
              </div>
            )
          }
        ]}
        data={visibleProjects}
        emptyText={viewState === "empty" ? "空狀態（dev）" : "尚無專案"}
      />
    </div>
  );
}
