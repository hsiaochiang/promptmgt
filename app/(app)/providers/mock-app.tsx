"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";

export type ProgressLog = {
  id: string;
  date: string;
  summary: string;
  link?: string;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  archived?: boolean;
  progressLogs: ProgressLog[];
};

export type Prompt = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  archived?: boolean;
};

export type Toast = {
  id: string;
  message: string;
  tone?: "info" | "success" | "warn" | "error";
};

type State = {
  projects: Project[];
  prompts: Prompt[];
  scratchpad: string;
  toasts: Toast[];
};

type Actions = {
  createProject: (input: { name: string; status?: string }) => Project | null;
  updateProject: (id: string, patch: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  addProgressLog: (projectId: string) => ProgressLog | null;
  updateProgressLog: (projectId: string, logId: string, patch: Partial<ProgressLog>) => void;
  createPrompt: (input: { projectId: string; title: string; body?: string; tags?: string[]; status?: string }) => Prompt | null;
  updatePrompt: (id: string, patch: Partial<Prompt>) => void;
  archivePrompt: (id: string) => void;
  movePrompt: (id: string, targetProjectId: string) => void;
  addTag: (promptId: string, tag: string) => void;
  removeTag: (promptId: string, tag: string) => void;
  setScratchpad: (value: string) => void;
  saveScratchpadAsPrompt: (input: { projectId: string; title?: string }) => Prompt | null;
  copyContent: (text: string) => Promise<void>;
  pushToast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
};

type ContextValue = State & { actions: Actions };

const MockAppContext = createContext<ContextValue | null>(null);

function makeProjects(): Project[] {
  return [
    {
      id: "p-01",
      name: "AI 工作流課程",
      status: "進行中",
      archived: false,
      progressLogs: [
        { id: "pl-01", date: "2025-12-24", summary: "完成 UI 動線雛形與 Pin 行為確認", link: "https://chat.openai.com/" },
        { id: "pl-02", date: "2025-12-22", summary: "定義 Frontmatter 與提示詞分類方式", link: "" }
      ]
    },
    {
      id: "p-02",
      name: "客戶提案",
      status: "進行中",
      archived: false,
      progressLogs: [{ id: "pl-03", date: "2025-12-23", summary: "整理一頁式提案與報價要素", link: "" }]
    }
  ];
}

function makePrompts(): Prompt[] {
  return [
    {
      id: "pr-01",
      projectId: "p-01",
      title: "UI/UX Review 提示詞",
      body: "列出 P0/P1/P2 問題，附調整規格。",
      tags: ["UI", "review"],
      status: "使用中",
      archived: false
    },
    {
      id: "pr-02",
      projectId: "p-01",
      title: "課程腳本",
      body: "整理課程章節、實作步驟、講者備註。",
      tags: ["script"],
      status: "草稿",
      archived: false
    },
    {
      id: "pr-03",
      projectId: "p-02",
      title: "一頁式提案",
      body: "痛點→解法→效益→工期→成本。",
      tags: ["one-pager"],
      status: "使用中",
      archived: false
    }
  ];
}

export function MockAppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => makeProjects());
  const [prompts, setPrompts] = useState<Prompt[]>(() => makePrompts());
  const [scratchpad, setScratchpad] = useState<string>("先把靈感貼這裡，確認後另存為提示詞。");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const toast: Toast = { id: nanoid(8), message, tone };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createProject = useCallback((input: { name: string; status?: string }) => {
    const name = input.name.trim();
    if (!name) return null;
    const project: Project = {
      id: nanoid(6),
      name,
      status: input.status ?? "進行中",
      archived: false,
      progressLogs: []
    };
    setProjects((prev) => [project, ...prev]);
    pushToast(`已新增專案：${name}`, "success");
    return project;
  }, [pushToast]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const archiveProject = useCallback((id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: true, status: "已歸檔" } : p)));
    pushToast("已將專案標記為歸檔", "warn");
  }, [pushToast]);

  const addProgressLog = useCallback((projectId: string) => {
    const log: ProgressLog = { id: nanoid(6), date: "", summary: "", link: "" };
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, progressLogs: [log, ...(p.progressLogs ?? [])] } : p)));
    return log;
  }, []);

  const updateProgressLog = useCallback((projectId: string, logId: string, patch: Partial<ProgressLog>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          progressLogs: (p.progressLogs ?? []).map((log) => (log.id === logId ? { ...log, ...patch } : log))
        };
      })
    );
  }, []);

  const createPrompt = useCallback((input: { projectId: string; title: string; body?: string; tags?: string[]; status?: string }) => {
    const title = input.title.trim();
    if (!title) return null;
    const prompt: Prompt = {
      id: nanoid(8),
      projectId: input.projectId,
      title,
      body: input.body ?? "",
      tags: input.tags ?? [],
      status: input.status ?? "草稿",
      archived: false
    };
    setPrompts((prev) => [prompt, ...prev]);
    pushToast(`已建立提示詞：${prompt.title}`, "success");
    return prompt;
  }, [pushToast]);

  const updatePrompt = useCallback((id: string, patch: Partial<Prompt>) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const archivePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, archived: true, status: "已歸檔" } : p)));
    pushToast("已歸檔提示詞", "warn");
  }, [pushToast]);

  const movePrompt = useCallback((id: string, targetProjectId: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, projectId: targetProjectId } : p)));
    pushToast("已移動提示詞", "info");
  }, [pushToast]);

  const addTag = useCallback((promptId: string, tag: string) => {
    const nextTag = tag.trim();
    if (!nextTag) return;
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === promptId && !p.tags.includes(nextTag) ? { ...p, tags: [...p.tags, nextTag] } : p
      )
    );
  }, []);

  const removeTag = useCallback((promptId: string, tag: string) => {
    setPrompts((prev) => prev.map((p) => (p.id === promptId ? { ...p, tags: p.tags.filter((t) => t !== tag) } : p)));
  }, []);

  const saveScratchpadAsPrompt = useCallback(
    (input: { projectId: string; title?: string }) => {
      const projectId = input.projectId || projects[0]?.id;
      if (!projectId) return null;
      const prompt = createPrompt({ projectId, title: input.title ?? "Scratchpad" });
      if (!prompt) return null;
      updatePrompt(prompt.id, { body: scratchpad });
      pushToast("已將 Scratchpad 另存為提示詞", "success");
      return { ...prompt, body: scratchpad };
    },
    [createPrompt, projects, scratchpad, pushToast, updatePrompt]
  );

  const copyContent = useCallback(
    async (text: string) => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        }
        pushToast("已複製內容", "success");
      } catch (err) {
        console.error("copyContent error", err);
        pushToast("複製失敗（測試或瀏覽器限制）", "warn");
      }
    },
    [pushToast]
  );

  const value = useMemo<ContextValue>(
    () => ({
      projects,
      prompts,
      scratchpad,
      toasts,
      actions: {
        createProject,
        updateProject,
        archiveProject,
        addProgressLog,
        updateProgressLog,
        createPrompt,
        updatePrompt,
        archivePrompt,
        movePrompt,
        addTag,
        removeTag,
        setScratchpad,
        saveScratchpadAsPrompt,
        copyContent,
        pushToast,
        dismissToast
      }
    }),
    [projects, prompts, scratchpad, toasts, addProgressLog, archiveProject, archivePrompt, createProject, createPrompt, copyContent, dismissToast, movePrompt, removeTag, addTag, saveScratchpadAsPrompt, setScratchpad, updateProgressLog, updateProject, updatePrompt, pushToast]
  );

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

export function useMockApp() {
  const ctx = useContext(MockAppContext);
  if (!ctx) throw new Error("useMockApp must be used within MockAppProvider");
  return ctx;
}
