"use client";

import React, { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Props {
  refreshKey?: number;
  onProjectsChange?: (projects: Project[]) => void;
}

export default function ProjectList({ refreshKey = 0, onProjectsChange }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);

  const fetchProjects = async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = (await res.json()) as Project[];
    setProjects(data);
    onProjectsChange?.(data);
    if (!selectedProjectId && data.length > 0) {
      setSelectedProjectId(data[0].name);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleAdd = async () => {
    const name = window.prompt("輸入新專案名稱", "新專案");
    if (!name) return;
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status: "規劃中" })
      });
      if (!res.ok) throw new Error("新增專案失敗");
      const created = (await res.json()) as Project;
      await fetchProjects();
      setSelectedProjectId(created.name);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "新增專案失敗");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (project: Project) => {
    const name = window.prompt("專案名稱", project.name) ?? project.name;
    const status = (window.prompt("專案狀態（規劃中/進行中/已結案）", project.status) as ProjectStatus | null) ?? project.status;
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, name, status })
      });
      if (!res.ok) throw new Error("更新專案失敗");
      const updated = (await res.json()) as Project;
      await fetchProjects();
      if (selectedProjectId === project.name) {
        setSelectedProjectId(updated.name);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "更新專案失敗");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`確定刪除專案「${project.name}」？`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id })
      });
      if (!res.ok) throw new Error("刪除專案失敗");
      await fetchProjects();
      if (selectedProjectId === project.name) {
        setSelectedProjectId(null);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "刪除專案失敗");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500">專案列表</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAdd}
            disabled={busy}
            className="text-[10px] px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60"
          >
            新增專案
          </button>
        </div>
      </div>
      {loading && <div className="text-[11px] text-slate-400">載入中…</div>}
      <div className="space-y-1.5">
        {projects.map((p) => (
          <div
            role="button"
            tabIndex={0}
            key={p.id}
            onClick={() => setSelectedProjectId(p.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedProjectId(p.name);
            }}
            className={
              "w-full text-left rounded-lg px-3 py-2 border text-xs flex flex-col gap-0.5 outline-none " +
              (p.name === selectedProjectId
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100")
            }
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold truncate">{p.name}</span>
              <span className="text-[10px] opacity-70">{p.promptCount} 篇</span>
            </div>
            <div className="flex items-center justify-between text-[10px] opacity-70">
              <span>{p.status}</span>
              <span>更新：{p.updatedAt ?? "—"}</span>
            </div>
            <div className="flex justify-end gap-1 text-[10px] mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(p);
                }}
                className="px-2 py-0.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
                disabled={busy}
              >
                編輯
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(p);
                }}
                className="px-2 py-0.5 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                disabled={busy}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
