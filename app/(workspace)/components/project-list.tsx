"use client";

import React, { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "@/lib/types/schema";
import { formatForUI_MMDD_HHmm } from "@/lib/utils/date";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import ConfirmModal from "./confirm-modal";

interface Props {
  refreshKey?: number;
  onProjectsChange?: (projects: Project[]) => void;
  onScheduleUndo?: (message: string, commit: () => Promise<void>, onUndo?: () => void) => void;
}

export default function ProjectList({ refreshKey = 0, onProjectsChange, onScheduleUndo }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const statusOptions: ProjectStatus[] = ["規劃中", "進行中", "已結案"];
  const [newProject, setNewProject] = useState<{ name: string; description: string; status: ProjectStatus }>({
    name: "",
    description: "",
    status: statusOptions[0]
  });
  const [confirmTarget, setConfirmTarget] = useState<Project | null>(null);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "全部">("全部");
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setNotice(null);
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

  const handleAdd = async (event?: React.FormEvent, override?: Partial<typeof newProject>) => {
    event?.preventDefault();
    const name = (override?.name ?? newProject.name).trim();
    if (!name) {
      setNotice("請輸入專案名稱");
      return;
    }
    const description = (override?.description ?? newProject.description).trim();
    const status = ((override?.status ?? newProject.status) ?? statusOptions[0]) as ProjectStatus;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status, description })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as any));
        if ((res.status === 409 || res.status === 400) && (payload as any)?.message) {
          setNotice((payload as any).message as string);
        }
        throw new Error("新增專案失敗");
      }
      const created = (await res.json()) as Project;
      await fetchProjects();
      setSelectedProjectId(created.name);
      setNotice("已建立專案");
      setNewProject({ name: "", description: "", status: statusOptions[0] });
      setShowCreateForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "新增專案失敗";
      setNotice(message);
      window.alert(message);
    } finally {
      setBusy(false);
    }
  };

  const handleQuickCreate = async () => {
    const name = (window.prompt("輸入專案名稱", "新專案") ?? "").trim();
    if (!name) return;
    await handleAdd(undefined, { name, description: "", status: statusOptions[0] });
  };

  const handleEdit = async (project: Project) => {
    const name = window.prompt("專案名稱", project.name) ?? project.name;
    const status = (window.prompt("專案狀態（規劃中/進行中/已結案）", project.status) as ProjectStatus | null) ?? project.status;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, name, status })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({} as any));
        if ((res.status === 409 || res.status === 400) && (payload as any)?.message) {
          setNotice((payload as any).message as string);
        }
        throw new Error("更新專案失敗");
      }
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

  const handleDeleteDeferred = (project: Project) => {
    const backup = project;
    setProjects((list) => list.filter((p) => p.id !== project.id));
    if (selectedProjectId === project.name) {
      setSelectedProjectId(null);
    }
    const commit = async () => {
      setBusy(true);
      setNotice(null);
      try {
        const res = await fetch("/api/projects", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: project.id })
        });
        if (!res.ok) throw new Error("刪除專案失敗");
        await fetchProjects();
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "刪除專案失敗");
        await fetchProjects();
      } finally {
        setBusy(false);
      }
    };
    const undo = () => {
      setProjects((list) => {
        if (list.find((p) => p.id === backup.id)) return list;
        return [backup, ...list];
      });
      setSelectedProjectId((id) => id ?? backup.name);
    };
    const schedule = onScheduleUndo ?? ((_, c, u) => { u?.(); c(); });
    schedule(`已排程刪除「${project.name}」，5 秒內可撤銷`, commit, undo);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">專案列表</span>
          <select
            className="text-[11px] rounded-full border border-slate-300 bg-white px-2 py-1"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | "全部")}
          >
            <option value="全部">全部</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋名稱"
            className="text-[11px] rounded-full border border-slate-300 bg-white px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              if (e.shiftKey) {
                setShowCreateForm((v) => !v);
                return;
              }
              void handleQuickCreate();
            }}
            disabled={busy}
            className="text-[10px] px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60"
          >
            新增專案
          </button>
        </div>
      </div>
      {showCreateForm && (
        <form onSubmit={handleAdd} className="mb-2 rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600 font-semibold" htmlFor="project-name">
              專案名稱
            </label>
            <input
              id="project-name"
              value={newProject.name}
              onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
              disabled={busy}
              className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-slate-400"
              placeholder="例如：行銷活動 A"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600 font-semibold" htmlFor="project-desc">
              簡述（選填）
            </label>
            <textarea
              id="project-desc"
              value={newProject.description}
              onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
              disabled={busy}
              rows={3}
              className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:border-slate-400 resize-none"
              placeholder="專案目標、範圍或備註"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600 font-semibold" htmlFor="project-status">
              狀態
            </label>
            <select
              id="project-status"
              value={newProject.status}
              onChange={(e) => setNewProject((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
              disabled={busy}
              className="rounded border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none focus:border-slate-400"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] hover:bg-slate-800 disabled:opacity-60"
            >
              建立專案
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowCreateForm(false);
                setNewProject({ name: "", description: "", status: statusOptions[0] });
                setNotice(null);
              }}
              className="px-3 py-1 rounded-full border border-slate-300 bg-white text-[11px] hover:bg-slate-50 disabled:opacity-60"
            >
              取消
            </button>
          </div>
        </form>
      )}
      {notice ? <div className="text-[11px] text-amber-700 mb-1">{notice}</div> : null}
      {loading && <div className="text-[11px] text-slate-400">載入中…</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {projects
          .filter((p) => (filterStatus === "全部" ? true : p.status === filterStatus))
          .filter((p) => (search.trim() ? p.name.toLowerCase().includes(search.toLowerCase()) : true))
          .map((p) => (
          <div
            role="button"
            tabIndex={0}
            key={p.id}
            onClick={() => setSelectedProjectId(p.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedProjectId(p.name);
            }}
            className={
              "w-full text-left rounded-lg px-3 py-3 border text-xs flex flex-col gap-1 outline-none shadow-sm transition-colors " +
              (p.name === selectedProjectId
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:border-slate-300")
            }
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold truncate">{p.name}</span>
              <span className="text-[10px] opacity-70">{p.promptCount} 篇</span>
            </div>
            <div className="flex items-center justify-between text-[10px] opacity-70">
              <span
                className={
                  "px-2 py-0.5 rounded-full border " +
                  (p.name === selectedProjectId ? "border-white/40 bg-white/10" : "border-slate-200 bg-slate-50")
                }
              >
                {p.status}
              </span>
              <span>更新：{formatForUI_MMDD_HHmm(p.updatedAt ?? "")}</span>
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
                   setConfirmTarget(p);
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
      <ConfirmModal
        open={!!confirmTarget}
        title="確認刪除專案"
        description={confirmTarget ? `將刪除專案「${confirmTarget.name}」，5 秒內可 Undo。` : ""}
        confirmText="刪除"
        cancelText="取消"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) handleDeleteDeferred(confirmTarget);
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
