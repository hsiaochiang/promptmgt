"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const res = await fetch("/api/projects");
      const data = (await res.json()) as Project[];
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
      setLoading(false);
    };
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-500">專案列表</span>
      </div>
      {loading && <div className="text-[11px] text-slate-400">載入中…</div>}
      <div className="space-y-1.5">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={
              "w-full text-left rounded-lg px-3 py-2 border text-xs flex flex-col gap-0.5 " +
              (p.id === selectedProjectId
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
          </button>
        ))}
      </div>
    </div>
  );
}
