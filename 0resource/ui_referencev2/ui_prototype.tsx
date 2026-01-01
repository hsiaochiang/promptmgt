import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * 提示詞管理系統｜React Canvas 雛形（單檔）
 * - Notion 風格：三段式版型（Sidebar / Main / Detail）
 * - 頁面：
 *   1) 專案及提示詞列表（依專案群組，專案下展開提示詞）
 *   2) 提示詞（列表 / 看板）
 *   3) 專案編輯頁（含「專案說明/檔案/進度紀錄」）
 *   4) 提示詞編輯頁（含剪貼簿片語插入）
 *   5) 剪貼簿（片語模組）
 * - UI 原則：
 *   1) 表格外框極簡（以留白、分隔線、hover 呈現）
 *   2) 按鈕預設無邊框，hover 才出現邊框
 *   3) 列表點選只開右側詳情，不跳頁；需要完整編輯再「進入」
 */

// ------------------------------
// Minimal hash router
// ------------------------------

type RouteName = "list" | "board" | "project" | "prompt" | "clipboard";

type Route =
  | { name: "list" }
  | { name: "board" }
  | { name: "project"; projectId: string }
  | { name: "prompt"; promptId: string }
  | { name: "clipboard" };

function parseHash(): Route {
  const raw = (window.location.hash || "#/list").replace(/^#/, "");
  const path = raw.startsWith("/") ? raw : "/list";
  const seg = path.split("?")[0].split("/").filter(Boolean);

  if (seg.length === 0 || seg[0] === "list") return { name: "list" };
  if (seg[0] === "board") return { name: "board" };
  if (seg[0] === "clipboard") return { name: "clipboard" };
  if (seg[0] === "projects" && seg[1]) return { name: "project", projectId: seg[1] };
  if (seg[0] === "prompts" && seg[1]) return { name: "prompt", promptId: seg[1] };
  return { name: "list" };
}

function go(to: string) {
  window.location.hash = to.startsWith("#") ? to : `#${to}`;
}

// ------------------------------
// Mock data (replace with real storage later)
// ------------------------------

type Status = "draft" | "ready" | "needs_review" | "deprecated" | "archived";

type Priority = "low" | "medium" | "high";

type Prompt = {
  id: string;
  title: string;
  projectId?: string;
  status: Status;
  priority: Priority;
  tags: string[];
  updatedAt: string;
  content: string;
  summary?: string;
};

type ProjectStatus = "planned" | "in_progress" | "paused" | "done";

type ProjectProgressRow = {
  id: string;
  date: string;
  summary: string;
  link?: string;
};

type ProjectFileRow = {
  id: string;
  name: string;
  note?: string;
  addedAt: string;
};

type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  tags: string[];
  dateRange?: string;
  description?: string;
  // 專案說明頁面的核心：對話/連結/摘要與「進度紀錄」
  overviewMarkdown?: string;
  progress: ProjectProgressRow[];
  files: ProjectFileRow[];
};

type Snippet = {
  id: string;
  title: string;
  category: "角色設定" | "回覆格式" | "限制條件" | "段落模板";
  content: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "草稿",
  ready: "可用",
  needs_review: "待優化",
  deprecated: "停用",
  archived: "封存",
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "規劃中",
  in_progress: "進行中",
  paused: "暫停",
  done: "完成",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}`;
}

const seedProjects: Project[] = [
  {
    id: "pjt-001",
    title: "提示詞管理系統",
    status: "in_progress",
    tags: ["UI/UX", "個人效率"],
    dateRange: "2026/01/01 –",
    description: "以專案導向管理提示詞與剪貼簿，檔案採 Markdown 儲存。",
    overviewMarkdown:
      "# 專案目的\n\n- 建立可用於個人日常的提示詞管理 UI\n- 支援列表 / 看板 / 詳細資料頁\n\n# 對話與摘要\n\n- 【2026-01-01】本次對話：建立 React Canvas 單檔雛形\n- 連結：\n  - https://example.com (示意)\n",
    progress: [
      { id: "prg-001", date: "2026-01-01", summary: "完成 UI 雛形 v1（list/board/edit/clipboard）", link: "https://example.com" },
    ],
    files: [
      { id: "fil-001", name: "uiux_spec_project_prompt_manager.md", note: "UI/UX 主要參考規格", addedAt: "2026-01-01" },
      { id: "fil-002", name: "功能腦力激盪整理.md", note: "功能發想與邏輯整理", addedAt: "2026-01-01" },
    ],
  },
  {
    id: "pjt-002",
    title: "RAG 教學內容",
    status: "in_progress",
    tags: ["RAG", "n8n"],
    dateRange: "2025/12/15 –",
    description: "整理課程提示詞、範例與講師稿。",
    overviewMarkdown: "# 專案目的\n\n- 彙整 RAG 教學提示詞與範例\n- 產出可直接上課的素材\n",
    progress: [
      { id: "prg-101", date: "2025-12-31", summary: "完成回答規範（不得臆測）初版" },
    ],
    files: [],
  },
  {
    id: "pjt-003",
    title: "企業內訓：AI Workflow",
    status: "planned",
    tags: ["簡報", "內訓"],
    dateRange: "2026/02/",
    description: "課程雛形與教材提示詞。",
    overviewMarkdown: "# 專案目的\n\n- 一天 6 小時工作坊\n- 聚焦：AI Workflow → AI Agent\n",
    progress: [],
    files: [],
  },
];

const seedPrompts: Prompt[] = [
  {
    id: "prm-001",
    title: "網站雛形：React Canvas 產生規格",
    projectId: "pjt-001",
    status: "ready",
    priority: "high",
    tags: ["React", "UI"],
    updatedAt: "2026-01-01",
    summary: "產出可 preview 的單檔 UI 雛形。",
    content:
      "# 角色設定\n你是資深前端工程師與 UI/UX 顧問。\n\n# 任務目標\n請以 React 單檔（Canvas）生成網站雛形…\n\n# 回應格式\n提供可直接貼上執行的 code。\n",
  },
  {
    id: "prm-002",
    title: "UI 一致性檢查清單（顧問版）",
    projectId: "pjt-001",
    status: "needs_review",
    priority: "medium",
    tags: ["UI", "規格"],
    updatedAt: "2026-01-01",
    content:
      "# 目標\n確保各頁按鈕、間距、動線一致。\n\n- 主 CTA：btn-primary\n- 次要：btn-ghost\n- 危險：btn-danger\n",
  },
  {
    id: "prm-003",
    title: "RAG：回答規範（不得臆測）",
    projectId: "pjt-002",
    status: "ready",
    priority: "high",
    tags: ["RAG", "品質"],
    updatedAt: "2025-12-31",
    content:
      "# 規範\n- 僅能根據提供的資料回答\n- 不確定就明確說不知道\n- 回答需附資料來源\n",
  },
  {
    id: "prm-004",
    title: "課程宣傳：10 分鐘逐字稿架構",
    projectId: "pjt-003",
    status: "draft",
    priority: "medium",
    tags: ["行銷", "逐字稿"],
    updatedAt: "2025-12-28",
    content: "# 需求\n請提供專業且內斂的逐字稿…\n",
  },
];

const seedSnippets: Snippet[] = [
  {
    id: "snp-001",
    title: "角色設定：解決方案顧問",
    category: "角色設定",
    updatedAt: "2026-01-01",
    content:
      "你是一位資深解決方案顧問，擅長把需求轉成可落地的規格與交付物，回答需正式且可直接貼入文件。",
  },
  {
    id: "snp-002",
    title: "回覆格式：Markdown（含章節與清單）",
    category: "回覆格式",
    updatedAt: "2026-01-01",
    content: "請以 Markdown 產出：\n1) 需求摘要\n2) 假設與限制\n3) 詳細步驟\n4) 驗收清單\n",
  },
  {
    id: "snp-003",
    title: "限制條件：不確定就說不知道",
    category: "限制條件",
    updatedAt: "2025-12-31",
    content: "若資料不足，請明確回答『目前資料不足，無法判定』，並列出需補充的資訊欄位。",
  },
  {
    id: "snp-004",
    title: "段落模板：提示詞結構",
    category: "段落模板",
    updatedAt: "2025-12-29",
    content: "# 角色設定\n# 任務目標\n# 輸入格式\n# 回應格式\n# 限制條件\n# 範例（可選）\n",
  },
];

// ------------------------------
// UI primitives (Notion-ish)
// ------------------------------

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function BorderlessButton(props: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={props.title}
      disabled={props.disabled}
      onClick={(e) => props.onClick?.(e)}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
        "border border-transparent bg-transparent",
        "hover:border-slate-200 hover:bg-slate-50",
        "active:bg-slate-100",
        "text-slate-700",
        "transition",
        props.disabled && "opacity-50 cursor-not-allowed hover:border-transparent hover:bg-transparent",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

function PrimaryButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "bg-slate-900 text-white",
        "hover:bg-slate-800",
        "active:bg-slate-900",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "transition"
      )}
    >
      {props.children}
    </button>
  );
}

function SecondaryButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "border border-slate-200 bg-white text-slate-800",
        "hover:bg-slate-50",
        "active:bg-slate-100",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "transition"
      )}
    >
      {props.children}
    </button>
  );
}

function DangerButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      title={props.title}
      onClick={props.onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "bg-rose-600 text-white",
        "hover:bg-rose-500",
        "active:bg-rose-600",
        "transition"
      )}
    >
      {props.children}
    </button>
  );
}

function Pill(props: {
  label: string;
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "purple";
  onClick?: () => void;
  title?: string;
}) {
  const tone = props.tone ?? "neutral";
  const toneClass: Record<typeof tone, string> = {
    neutral: "bg-slate-100 text-slate-700",
    blue: "bg-sky-100 text-sky-800",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
    purple: "bg-violet-100 text-violet-800",
  };

  const Base = (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[tone]
      )}
    >
      {props.label}
    </span>
  );

  if (!props.onClick) return Base;
  return (
    <button
      title={props.title}
      onClick={() => props.onClick?.()}
      className={cx("rounded-full border border-transparent", "hover:border-slate-200", "transition")}
    >
      {Base}
    </button>
  );
}

function Divider() {
  return <div className="h-px w-full bg-slate-100" />;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="w-full">
      {props.label ? <div className="mb-1 text-xs text-slate-500">{props.label}</div> : null}
      <input
        {...props}
        className={cx(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-slate-200",
          props.className
        )}
      />
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="w-full">
      {props.label ? <div className="mb-1 text-xs text-slate-500">{props.label}</div> : null}
      <textarea
        {...props}
        className={cx(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-slate-200",
          props.className
        )}
      />
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="w-full">
      {props.label ? <div className="mb-1 text-xs text-slate-500">{props.label}</div> : null}
      <select
        {...props}
        className={cx(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-slate-200",
          props.className
        )}
      />
    </div>
  );
}

function PropIcon(props: { name: "text" | "status" | "priority" | "tags" | "date" | "project" | "action" }) {
  const map: Record<typeof props.name, string> = {
    text: "Aa",
    status: "◉",
    priority: "⇧",
    tags: "⌗",
    date: "⏱",
    project: "▦",
    action: "↗",
  };
  return <span>{map[props.name]}</span>;
}

// Simple popover
function Popover(props: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!props.open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (props.anchorRef.current?.contains(t)) return;
      props.onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [props.open, props.onClose, props.anchorRef]);

  if (!props.open) return null;

  const rect = props.anchorRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - (props.width ?? 320) - 12),
        width: props.width ?? 320,
        zIndex: 50,
      }
    : { position: "fixed", top: 80, left: 80, width: props.width ?? 320, zIndex: 50 };

  return (
    <div ref={panelRef} style={style} className={cx("rounded-xl border border-slate-200 bg-white shadow-sm", "p-2")}>
      {props.children}
    </div>
  );
}

// Table: subtle header, inner gridlines, no outer frame
function GridTable(props: {
  columns: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    width?: string;
    align?: "left" | "right" | "center";
  }>;
  rows: Array<Record<string, React.ReactNode>>;
  onRowClick?: (idx: number) => void;
}) {
  const template = props.columns.map((c) => c.width ?? "1fr").join(" ");

  return (
    <div className="w-full">
      <div
        className={cx("grid items-center", "bg-white", "px-2", "py-1", "text-[11px]", "font-medium", "text-slate-500")}
        style={{ gridTemplateColumns: template }}
      >
        {props.columns.map((c, i) => (
          <div
            key={c.key}
            className={cx(
              "flex items-center gap-2",
              "py-1",
              i !== props.columns.length - 1 && "border-r border-slate-200 pr-3",
              c.align === "right" && "justify-end text-right",
              c.align === "center" && "justify-center text-center"
            )}
          >
            <span className="text-[11px] text-slate-400">{c.icon ?? null}</span>
            <span className="truncate">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-slate-200" />

      <div className="bg-white">
        {props.rows.map((r, idx) => {
          const isLast = idx === props.rows.length - 1;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => props.onRowClick?.(idx)}
              className={cx(
                "group",
                "grid w-full items-center",
                "px-2 py-2",
                "text-left text-sm",
                "bg-white",
                "transition",
                "hover:bg-slate-50",
                "hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.35)]",
                "focus:outline-none focus:shadow-[inset_0_0_0_2px_rgba(148,163,184,0.35)]",
                !isLast && "border-b border-slate-200"
              )}
              style={{ gridTemplateColumns: template }}
            >
              {props.columns.map((c, i) => (
                <div
                  key={c.key}
                  className={cx(
                    "min-w-0 truncate",
                    "py-0.5",
                    i !== props.columns.length - 1 && "border-r border-slate-200 pr-3",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center"
                  )}
                >
                  {r[c.key] ?? null}
                </div>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState(props: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="text-base font-semibold text-slate-900">{props.title}</div>
        {props.hint ? <div className="mt-2 text-sm text-slate-600">{props.hint}</div> : null}
        {props.action ? <div className="mt-4 flex justify-center">{props.action}</div> : null}
      </div>
    </div>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------
// App
// ------------------------------

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [prompts, setPrompts] = useState<Prompt[]>(seedPrompts);
  const [snippets, setSnippets] = useState<Snippet[]>(seedSnippets);

  const [globalQuery, setGlobalQuery] = useState("");

  useEffect(() => {
    if (!window.location.hash) go("/list");
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const promptById = useMemo(() => new Map(prompts.map((p) => [p.id, p])), [prompts]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    prompts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    projects.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [prompts, projects]);

  const filteredPrompts = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => {
      const projectName = p.projectId ? projectById.get(p.projectId)?.title ?? "" : "";
      const hay = [p.title, p.summary ?? "", p.content, projectName, p.tags.join(" ")].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [globalQuery, prompts, projectById]);

  const promptsByProject = useMemo(() => {
    const map = new Map<string, Prompt[]>();
    filteredPrompts.forEach((pr) => {
      const pid = pr.projectId ?? "__no_project__";
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(pr);
    });

    const ordered: Array<{ project: Project | null; prompts: Prompt[] }> = [];
    projects.forEach((p) => {
      const ps = map.get(p.id) ?? [];
      ordered.push({ project: p, prompts: ps.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
    });
    if (map.get("__no_project__")?.length) {
      ordered.push({
        project: null,
        prompts: (map.get("__no_project__") ?? []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      });
    }

    return ordered;
  }, [filteredPrompts, projects]);

  // Detail selection (used on list/board/clipboard)
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  useEffect(() => {
    // 進入編輯頁時，右側詳情 panel 改為清空（避免混淆）
    if (route.name === "project" || route.name === "prompt") {
      setSelectedPromptId(null);
      setSelectedProjectId(null);
      setSelectedSnippetId(null);
    }
  }, [route.name]);

  // ------------------------------
  // Mutations
  // ------------------------------

  function upsertPrompt(patch: Partial<Prompt> & { id: string }) {
    setPrompts((prev) =>
      prev.map((p) => (p.id === patch.id ? { ...p, ...patch, updatedAt: patch.updatedAt ?? todayISO() } : p))
    );
  }

  function removePrompt(id: string) {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }

  function upsertProject(patch: Partial<Project> & { id: string }) {
    setProjects((prev) => prev.map((p) => (p.id === patch.id ? { ...p, ...patch } : p)));
  }

  function removeProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // 同步清掉關聯（示意：僅解除 projectId）
    setPrompts((prev) => prev.map((x) => (x.projectId === id ? { ...x, projectId: undefined, updatedAt: todayISO() } : x)));
  }

  function createPrompt(projectId?: string) {
    const id = uid("prm");
    const p: Prompt = {
      id,
      title: "新提示詞",
      projectId,
      status: "draft",
      priority: "medium",
      tags: [],
      updatedAt: todayISO(),
      summary: "",
      content: "# 角色設定\n\n# 任務目標\n\n# 輸入格式\n\n# 回應格式\n\n# 限制條件\n",
    };
    setPrompts((prev) => [p, ...prev]);
    go(`/prompts/${id}`);
  }

  function createProject() {
    const id = uid("pjt");
    const p: Project = {
      id,
      title: "新專案",
      status: "planned",
      tags: [],
      dateRange: "",
      description: "",
      overviewMarkdown: "# 專案目的\n\n- （請補充）\n",
      progress: [],
      files: [],
    };
    setProjects((prev) => [p, ...prev]);
    go(`/projects/${id}`);
  }

  function createSnippet() {
    const id = uid("snp");
    const s: Snippet = {
      id,
      title: "新片語",
      category: "段落模板",
      updatedAt: todayISO(),
      content: "",
    };
    setSnippets((prev) => [s, ...prev]);
    setSelectedSnippetId(id);
  }

  // ------------------------------
  // Shell
  // ------------------------------

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900">
      <AppShell
        route={route}
        globalQuery={globalQuery}
        setGlobalQuery={setGlobalQuery}
        onNav={(hashPath) => {
          setSelectedPromptId(null);
          setSelectedProjectId(null);
          setSelectedSnippetId(null);
          go(hashPath);
        }}
      >
        {/* Main */}
        <div className="h-full">
          {route.name === "list" ? (
            <ProjectPromptListPage
              projects={projects}
              promptsByProject={promptsByProject}
              prompts={filteredPrompts}
              projectById={projectById}
              onOpenProject={(id) => {
                setSelectedProjectId(id);
                setSelectedPromptId(null);
                setSelectedSnippetId(null);
              }}
              onOpenPrompt={(id) => {
                setSelectedPromptId(id);
                setSelectedProjectId(null);
                setSelectedSnippetId(null);
              }}
              onSelectPrompt={(id) => {
                setSelectedPromptId(id);
                setSelectedProjectId(null);
                setSelectedSnippetId(null);
              }}
              onMoveStatus={(id, next) => upsertPrompt({ id, status: next, updatedAt: todayISO() })}
              onGoProject={(id) => go(`/projects/${id}`)}
              onGoPrompt={(id) => go(`/prompts/${id}`)}
              onCreatePrompt={createPrompt}
              onCreateProject={createProject}
            />
          ) : route.name === "board" ? (
            <PromptBoardPage
              prompts={filteredPrompts}
              projectById={projectById}
              onSelectPrompt={(id) => {
                setSelectedPromptId(id);
                setSelectedProjectId(null);
                setSelectedSnippetId(null);
              }}
              onOpenPrompt={(id) => go(`/prompts/${id}`)}
              onMoveStatus={(id, next) => upsertPrompt({ id, status: next, updatedAt: todayISO() })}
              onCreatePrompt={() => createPrompt(undefined)}
            />
          ) : route.name === "clipboard" ? (
            <ClipboardPage
              snippets={snippets}
              selectedId={selectedSnippetId}
              onSelect={(id) => {
                setSelectedSnippetId(id);
                setSelectedPromptId(null);
                setSelectedProjectId(null);
              }}
              onCreate={createSnippet}
              onUpdate={(id, patch) =>
                setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: todayISO() } : s)))
              }
              onDelete={(id) => {
                setSnippets((prev) => prev.filter((s) => s.id !== id));
                setSelectedSnippetId((cur) => (cur === id ? null : cur));
              }}
            />
          ) : route.name === "project" ? (
            <ProjectEditPage
              project={projectById.get(route.projectId) ?? null}
              prompts={prompts.filter((p) => p.projectId === route.projectId)}
              onBack={() => go("/list")}
              onUpdate={(patch) => upsertProject({ id: route.projectId, ...patch })}
              onOpenPrompt={(id) => go(`/prompts/${id}`)}
              onCreatePrompt={() => createPrompt(route.projectId)}
              onDeleteProject={() => {
                removeProject(route.projectId);
                go("/list");
              }}
            />
          ) : route.name === "prompt" ? (
            <PromptEditPage
              prompt={promptById.get(route.promptId) ?? null}
              projects={projects}
              allTags={allTags}
              snippets={snippets}
              onBack={() => go("/list")}
              onUpdate={(patch) => upsertPrompt({ id: route.promptId, ...patch, updatedAt: todayISO() })}
              onDelete={() => {
                removePrompt(route.promptId);
                go("/list");
              }}
              onInsertSnippet={(text) => {
                const p = promptById.get(route.promptId);
                if (!p) return;
                upsertPrompt({ id: p.id, content: `${p.content}\n\n${text}`.trim(), updatedAt: todayISO() });
              }}
            />
          ) : null}
        </div>

        {/* Detail Panel */}
        <DetailPanel
          route={route}
          selectedPrompt={selectedPromptId ? promptById.get(selectedPromptId) ?? null : null}
          selectedProject={selectedProjectId ? projectById.get(selectedProjectId) ?? null : null}
          selectedSnippet={selectedSnippetId ? snippets.find((s) => s.id === selectedSnippetId) ?? null : null}
          projectById={projectById}
          onClose={() => {
            setSelectedPromptId(null);
            setSelectedProjectId(null);
            setSelectedSnippetId(null);
          }}
          onGoPrompt={(id) => go(`/prompts/${id}`)}
          onGoProject={(id) => go(`/projects/${id}`)}
          onUpdatePrompt={(patch) =>
            selectedPromptId && upsertPrompt({ id: selectedPromptId, ...patch, updatedAt: todayISO() })
          }
          onUpdateProject={(patch) => selectedProjectId && upsertProject({ id: selectedProjectId, ...patch })}
          onCopy={(text) => copyText(text)}
        />
      </AppShell>
    </div>
  );
}

function AppShell(props: {
  route: Route;
  globalQuery: string;
  setGlobalQuery: (v: string) => void;
  onNav: (hashPath: string) => void;
  children: React.ReactNode;
}) {
  const routeLabel =
    props.route.name === "list"
      ? "專案及提示詞列表"
      : props.route.name === "board"
      ? "提示詞"
      : props.route.name === "project"
      ? "專案編輯"
      : props.route.name === "prompt"
      ? "提示詞編輯"
      : "剪貼簿";

  return (
    <div className="grid h-full w-full grid-cols-[260px_1fr_360px]">
      {/* Sidebar */}
      <aside className="h-full border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">提示詞管理系統</div>
          <BorderlessButton title="回到預設頁（專案及提示詞列表）" onClick={() => props.onNav("/list")} className="text-xs">
            Home
          </BorderlessButton>
        </div>

        <div className="px-4 pb-3">
          <Input value={props.globalQuery} onChange={(e) => props.setGlobalQuery(e.target.value)} placeholder="搜尋：標題 / 內容 / 標籤" />
        </div>

        <div className="px-2">
          <NavItem active={props.route.name === "list"} label="專案及提示詞列表" hint="依專案群組" onClick={() => props.onNav("/list")} />
          <NavItem active={props.route.name === "board"} label="提示詞" hint="列表 / 看板" onClick={() => props.onNav("/board")} />
          <NavItem active={props.route.name === "clipboard"} label="剪貼簿" hint="片語 / 模組" onClick={() => props.onNav("/clipboard")} />
        </div>

        <div className="mt-4 px-4">
          <Divider />
          <div className="mt-3 text-xs text-slate-500">目前頁面</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{routeLabel}</div>
          <div className="mt-2 text-xs text-slate-500">使用原則</div>
          <ul className="mt-1 list-disc pl-4 text-xs text-slate-600">
            <li>列表點選：只開右側詳情（不跳頁）</li>
            <li>需要完整編輯：請按「進入」</li>
            <li>按鈕預設無框：hover 才顯示邊框</li>
          </ul>
        </div>
      </aside>

      {/* Main */}
      <main className="h-full overflow-hidden">
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">{routeLabel}</div>
              <div className="text-xs text-slate-500">三段式版型（Sidebar / Main / Detail），支援列表與看板（雛形）</div>
            </div>
            <div className="flex items-center gap-2">
              <BorderlessButton title="快速回到列表" onClick={() => props.onNav("/list")}>回列表</BorderlessButton>
            </div>
          </header>
          <div className="h-full overflow-auto">{props.children}</div>
        </div>
      </main>

      {/* Detail panel slot (real content is rendered by <DetailPanel/>) */}
      <aside className="h-full border-l border-slate-200 bg-white" />
    </div>
  );
}

function NavItem(props: { active: boolean; label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={cx(
        "w-full rounded-xl px-3 py-2 text-left",
        "border border-transparent",
        "hover:border-slate-200 hover:bg-slate-50",
        props.active ? "bg-slate-50" : "bg-transparent"
      )}
    >
      <div className="text-sm font-medium text-slate-900">{props.label}</div>
      {props.hint ? <div className="text-xs text-slate-500">{props.hint}</div> : null}
    </button>
  );
}

// ------------------------------
// Pages
// ------------------------------

function PageToolbar(props: {
  left?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  primaryAction?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-2 backdrop-blur">
      <div className="flex items-center gap-2">{props.left}</div>
      <div className="flex items-center gap-2">
        {props.secondaryActions}
        {props.primaryAction}
      </div>
    </div>
  );
}

function ProjectPromptListPage(props: {
  projects: Project[];
  promptsByProject: Array<{ project: Project | null; prompts: Prompt[] }>;
  prompts: Prompt[];
  projectById: Map<string, Project>;
  onOpenProject: (id: string) => void;
  onOpenPrompt: (id: string) => void;
  onGoProject: (id: string) => void;
  onGoPrompt: (id: string) => void;
  onCreatePrompt: (projectId?: string) => void;
  onCreateProject: () => void;
  onSelectPrompt?: (id: string) => void;
  onMoveStatus?: (id: string, next: Status) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"list" | "board">("list");

  const promptCountByProjectId = useMemo(() => {
    const m = new Map<string, number>();
    props.promptsByProject.forEach((g) => {
      if (g.project) m.set(g.project.id, g.prompts.length);
    });
    return m;
  }, [props.promptsByProject]);

  useEffect(() => {
    if (props.promptsByProject.length) {
      const first = props.promptsByProject[0].project?.id ?? "__no_project__";
      setExpanded((e) => ({ ...e, [first]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // columns for board view: group prompts by status
  const columns = useMemo(() => {
    const statuses: Array<{ key: Status; title: string }> = [
      { key: "draft", title: "草稿" },
      { key: "needs_review", title: "待優化" },
      { key: "ready", title: "可用" },
      { key: "deprecated", title: "停用" },
      { key: "archived", title: "封存" },
    ];

    return statuses.map((s) => ({
      title: s.title,
      items: props.prompts.filter((p) => p.status === s.key).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }));
  }, [props.prompts]);

  return (
    <div className="h-full">
      <PageToolbar
        left={
          <>
            <BorderlessButton title="列表：列出所有提示詞（預設）" className={mode === "list" ? "bg-white" : ""} onClick={() => setMode("list")}>
              列表
            </BorderlessButton>
            <BorderlessButton title="看板：依提示詞狀態分欄" className={mode === "board" ? "bg-white" : ""} onClick={() => setMode("board")}>
              看板
            </BorderlessButton>
          </>
        }
        primaryAction={<PrimaryButton title="新增提示詞" onClick={props.onCreatePrompt}>新建提示詞</PrimaryButton>}
      />

      {mode === "list" ? (
        <div className="px-5 py-4">
          <div className="mb-3 text-sm text-slate-600">列表呈現所有提示詞；點選列可開右側詳情。</div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <GridTable
              columns={[
                { key: "title", label: "提示詞", icon: <PropIcon name="text" />, width: "2fr" },
                { key: "project", label: "專案", icon: <PropIcon name="project" />, width: "1.2fr" },
                { key: "status", label: "狀態", icon: <PropIcon name="status" />, width: "0.9fr" },
                { key: "priority", label: "優先", icon: <PropIcon name="priority" />, width: "0.7fr", align: "center" },
                { key: "tags", label: "標籤", icon: <PropIcon name="tags" />, width: "1.2fr" },
                { key: "updatedAt", label: "更新", icon: <PropIcon name="date" />, width: "0.8fr", align: "right" },
                { key: "actions", label: "", icon: <PropIcon name="action" />, width: "0.9fr", align: "right" },
              ]}
              rows={props.prompts
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((p) => ({
                  title: (
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{p.title}</div>
                      {p.summary ? <div className="mt-0.5 truncate text-xs text-slate-500">{p.summary}</div> : null}
                    </div>
                  ),
                  project: (
                    <span className="text-sm text-slate-700">
                      {p.projectId ? props.projectById.get(p.projectId)?.title ?? "（未知）" : "（未指定）"}
                    </span>
                  ),
                  status: (
                    <Pill
                      label={STATUS_LABEL[p.status]}
                      tone={p.status === "ready" ? "green" : p.status === "needs_review" ? "blue" : p.status === "draft" ? "amber" : "neutral"}
                    />
                  ),
                  priority: (
                    <Pill
                      label={PRIORITY_LABEL[p.priority]}
                      tone={p.priority === "high" ? "red" : p.priority === "medium" ? "purple" : "neutral"}
                    />
                  ),
                  tags: (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <Pill key={t} label={t} />
                      ))}
                      {p.tags.length > 3 ? <span className="text-xs text-slate-400">+{p.tags.length - 3}</span> : null}
                    </div>
                  ),
                  updatedAt: <span className="text-xs text-slate-600">{p.updatedAt}</span>,
                  actions: (
                    <div className="flex justify-end gap-1">
                      <BorderlessButton title="開啟右側詳情" onClick={() => props.onSelectPrompt?.(p.id)} className="text-xs">
                        開右側
                      </BorderlessButton>
                      <BorderlessButton title="進入提示詞編輯頁" onClick={() => props.onOpenPrompt(p.id)} className="text-xs">
                        進入
                      </BorderlessButton>
                    </div>
                  ),
                }))}
              onRowClick={(idx) => {
                const sorted = props.prompts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
                props.onSelectPrompt?.(sorted[idx].id);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="mb-3 text-sm text-slate-600">看板以「提示詞狀態」分欄；卡片提供快速移動狀態與進入編輯。</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            {columns.map((col) => (
              <div key={col.title} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">{col.title}</div>
                  <div className="text-xs text-slate-500">{col.items.length}</div>
                </div>
                <div className="space-y-2">
                  {col.items.map((p) => (
                    <BoardCard
                      key={p.id}
                      prompt={p}
                      projectName={p.projectId ? props.projectById.get(p.projectId)?.title ?? "（未知）" : "（未指定）"}
                      onOpenRight={() => props.onSelectPrompt?.(p.id)}
                      onEnter={() => props.onOpenPrompt(p.id)}
                      onMove={(next) => props.onMoveStatus?.(p.id, next)}
                    />
                  ))}
                  {!col.items.length ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">無項目</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PromptBoardPage(props: {
  prompts: Prompt[];
  projectById: Map<string, Project>;
  onSelectPrompt?: (id: string) => void;
  onOpenPrompt: (id: string) => void;
  onMoveStatus?: (id: string, next: Status) => void;
  onCreatePrompt?: () => void;
}) {
  const statuses: Array<{ key: Status; title: string }> = [
    { key: "draft", title: "草稿" },
    { key: "needs_review", title: "待優化" },
    { key: "ready", title: "可用" },
    { key: "deprecated", title: "停用" },
    { key: "archived", title: "封存" },
  ];

  const columns = statuses.map((s) => ({ title: s.title, items: props.prompts.filter((p) => p.status === s.key) }));

  return (
    <div className="h-full">
      <PageToolbar
        left={<div className="text-sm text-slate-600">看板：依提示詞狀態分欄，拖放尚未實作（雛形）。</div>}
        primaryAction={<PrimaryButton title="新增提示詞" onClick={props.onCreatePrompt}>新建提示詞</PrimaryButton>}
      />

      <div className="px-5 py-4">
        <div className="mb-3 text-sm text-slate-600">看板以「提示詞狀態」分欄；卡片提供快速移動狀態與進入編輯。</div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col) => (
            <div key={col.title} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">{col.title}</div>
                <div className="text-xs text-slate-500">{col.items.length}</div>
              </div>
              <div className="space-y-2">
                {col.items.map((p) => (
                  <BoardCard
                    key={p.id}
                    prompt={p}
                    projectName={p.projectId ? props.projectById.get(p.projectId)?.title ?? "（未知）" : "（未指定）"}
                    onOpenRight={() => props.onSelectPrompt?.(p.id)}
                    onEnter={() => props.onOpenPrompt(p.id)}
                    onMove={(next) => props.onMoveStatus?.(p.id, next)}
                  />
                ))}
                {!col.items.length ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">無項目</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClipboardPage(props: {
  snippets: Snippet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<Snippet>) => void;
  onDelete: (id: string) => void;
}) {
  const selected = props.selectedId ? props.snippets.find((s) => s.id === props.selectedId) ?? null : null;

  return (
    <div className="h-full">
      <PageToolbar
        left={<div className="text-sm text-slate-600">剪貼簿：可復用片語模組（角色設定 / 回覆格式 / 限制條件 / 段落模板）</div>}
        primaryAction={<PrimaryButton title="新增片語" onClick={props.onCreate}>新建片語</PrimaryButton>}
      />

      <div className="grid h-[calc(100%-44px)] grid-cols-[360px_1fr] gap-4 px-5 py-4">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">片語列表</div>
            <div className="text-xs text-slate-500">{props.snippets.length}</div>
          </div>

          <div className="space-y-2">
            {props.snippets.map((s) => (
              <button
                key={s.id}
                onClick={() => props.onSelect(s.id)}
                className={cx(
                  "w-full rounded-xl border p-3 text-left transition",
                  props.selectedId === s.id ? "border-slate-200 bg-slate-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                )}
                title="點選後可於右側編輯"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{s.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{s.category} · 更新 {s.updatedAt}</div>
                  </div>
                  <Pill label={s.category} />
                </div>
              </button>
            ))}

            {!props.snippets.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">尚無片語。</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          {!selected ? (
            <EmptyState title="請從左側選擇一個片語" hint="或按右上角『新建片語』建立新的模組。" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-900">{selected.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Pill label={selected.category} tone="neutral" />
                    <span className="text-xs text-slate-500">更新：{selected.updatedAt}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <BorderlessButton
                    title="複製片語內容到剪貼簿"
                    onClick={async () => {
                      await copyText(selected.content);
                    }}
                  >
                    複製
                  </BorderlessButton>
                  <DangerButton title="刪除此片語" onClick={() => props.onDelete(selected.id)}>
                    刪除
                  </DangerButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="標題"
                  value={selected.title}
                  onChange={(e) => props.onUpdate(selected.id, { title: e.target.value })}
                />
                <Select
                  label="分類"
                  value={selected.category}
                  onChange={(e) => props.onUpdate(selected.id, { category: e.target.value as any })}
                >
                  <option value="角色設定">角色設定</option>
                  <option value="回覆格式">回覆格式</option>
                  <option value="限制條件">限制條件</option>
                  <option value="段落模板">段落模板</option>
                </Select>
              </div>

              <Textarea
                label="內容"
                value={selected.content}
                onChange={(e) => props.onUpdate(selected.id, { content: e.target.value })}
                rows={14}
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                用途建議：提示詞編輯頁可一鍵插入這些片語（在提示詞編輯頁的「插入片語」）。
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectEditPage(props: {
  project: Project | null;
  prompts: Prompt[];
  onBack: () => void;
  onUpdate: (patch: Partial<Project>) => void;
  onOpenPrompt: (id: string) => void;
  onCreatePrompt: () => void;
  onDeleteProject: () => void;
}) {
  const p = props.project;
  const [tab, setTab] = useState<"overview" | "progress" | "files">("overview");

  const [progressEditingId, setProgressEditingId] = useState<string | null>(null);

  if (!p) {
    return <EmptyState title="找不到專案" hint="此專案可能已刪除或尚未建立。" action={<BorderlessButton onClick={props.onBack}>回列表</BorderlessButton>} />;
  }

  return (
    <div className="h-full">
      <PageToolbar
        left={
          <>
            <BorderlessButton title="回到列表" onClick={props.onBack}>← 返回</BorderlessButton>
            <div className="text-sm text-slate-600">專案編輯：{p.title}</div>
          </>
        }
        secondaryActions={
          <>
            <BorderlessButton title="在此專案下新增提示詞" onClick={props.onCreatePrompt}>新提示詞</BorderlessButton>
          </>
        }
      primaryAction={
          <PrimaryButton title="完成編輯並返回" onClick={props.onBack}>
            完成
          </PrimaryButton>
        }
      />

      <div className="px-5 py-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">{p.title}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill label={PROJECT_STATUS_LABEL[p.status]} tone={p.status === "done" ? "green" : p.status === "in_progress" ? "blue" : p.status === "paused" ? "amber" : "neutral"} />
                  {p.tags.map((t) => (
                    <Pill key={t} label={t} />
                  ))}
                  {p.dateRange ? <span className="text-xs text-slate-500">期間：{p.dateRange}</span> : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DangerButton title="刪除此專案（提示詞會解除關聯）" onClick={props.onDeleteProject}>刪除專案</DangerButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="專案名稱" value={p.title} onChange={(e) => props.onUpdate({ title: e.target.value })} />
              <Select label="狀態" value={p.status} onChange={(e) => props.onUpdate({ status: e.target.value as any })}>
                <option value="planned">規劃中</option>
                <option value="in_progress">進行中</option>
                <option value="paused">暫停</option>
                <option value="done">完成</option>
              </Select>
              <Input label="期間（可選）" value={p.dateRange ?? ""} onChange={(e) => props.onUpdate({ dateRange: e.target.value })} />
              <Input
                label="標籤（以逗號分隔）"
                value={p.tags.join(", ")}
                onChange={(e) =>
                  props.onUpdate({
                    tags: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            <Textarea label="簡短說明（可選）" value={p.description ?? ""} onChange={(e) => props.onUpdate({ description: e.target.value })} rows={3} />

            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <BorderlessButton title="專案說明頁面（Markdown）」" className={tab === "overview" ? "bg-slate-50" : ""} onClick={() => setTab("overview")}>專案說明</BorderlessButton>
              <BorderlessButton title="進度紀錄（含日期欄位；預設不可編輯，點擊『編輯』後才可改）" className={tab === "progress" ? "bg-slate-50" : ""} onClick={() => setTab("progress")}>進度紀錄</BorderlessButton>
              <BorderlessButton title="檔案上傳（雛形為清單與輸入；實作時可接 file system / Git）」" className={tab === "files" ? "bg-slate-50" : ""} onClick={() => setTab("files")}>檔案</BorderlessButton>
            </div>

            {tab === "overview" ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-600">用途：記錄本專案的對話連結、摘要與關鍵決策（以 Markdown 存放）。</div>
                <Textarea
                  label="專案說明（Markdown）"
                  value={p.overviewMarkdown ?? ""}
                  onChange={(e) => props.onUpdate({ overviewMarkdown: e.target.value })}
                  rows={14}
                />
              </div>
            ) : null}

            {tab === "progress" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">進度紀錄：預設為不可編輯；點擊單列的「編輯」後才可修改。</div>
                  <BorderlessButton
                    title="新增一筆進度紀錄（會預設為可編輯狀態）"
                    onClick={() => {
                      const row: ProjectProgressRow = { id: uid("prg"), date: todayISO(), summary: "", link: "" };
                      props.onUpdate({ progress: [row, ...p.progress] });
                      setProgressEditingId(row.id);
                    }}
                  >
                    新增進度
                  </BorderlessButton>
                </div>

                <div className="rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[120px_1fr_120px_120px] gap-0 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                    <div>日期</div>
                    <div>摘要</div>
                    <div>連結</div>
                    <div className="text-right">操作</div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {p.progress.map((r) => {
                      const isEdit = progressEditingId === r.id;
                      return (
                        <div key={r.id} className="grid grid-cols-[120px_1fr_120px_120px] items-center gap-0 px-3 py-2">
                          <div>
                            {isEdit ? (
                              <input
                                value={r.date}
                                onChange={(e) => props.onUpdate({ progress: p.progress.map((x) => (x.id === r.id ? { ...x, date: e.target.value } : x)) })}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                              />
                            ) : (
                              <div className="text-sm text-slate-700">{r.date}</div>
                            )}
                          </div>

                          <div className="min-w-0">
                            {isEdit ? (
                              <input
                                value={r.summary}
                                onChange={(e) => props.onUpdate({ progress: p.progress.map((x) => (x.id === r.id ? { ...x, summary: e.target.value } : x)) })}
                                placeholder="本次進度摘要"
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                              />
                            ) : (
                              <div className="truncate text-sm text-slate-700">{r.summary || <span className="text-slate-400">（未填）</span>}</div>
                            )}
                          </div>

                          <div>
                            {isEdit ? (
                              <input
                                value={r.link ?? ""}
                                onChange={(e) => props.onUpdate({ progress: p.progress.map((x) => (x.id === r.id ? { ...x, link: e.target.value } : x)) })}
                                placeholder="https://..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                              />
                            ) : (
                              <button
                                className={cx(
                                  "rounded-lg px-2 py-1 text-sm",
                                  "border border-transparent",
                                  "hover:border-slate-200 hover:bg-slate-50",
                                  "transition",
                                  "text-slate-700"
                                )}
                                title={r.link ? r.link : "未填"}
                                onClick={async () => {
                                  if (!r.link) return;
                                  await copyText(r.link);
                                }}
                              >
                                連結
                              </button>
                            )}
                          </div>

                          <div className="flex justify-end gap-2">
                            {isEdit ? (
                              <>
                                <BorderlessButton title="儲存並回到唯讀" onClick={() => setProgressEditingId(null)} className="text-xs">完成</BorderlessButton>
                                <BorderlessButton
                                  title="刪除此筆進度"
                                  onClick={() => props.onUpdate({ progress: p.progress.filter((x) => x.id !== r.id) })}
                                  className="text-xs"
                                >
                                  刪除
                                </BorderlessButton>
                              </>
                            ) : (
                              <BorderlessButton title="切換為可編輯" onClick={() => setProgressEditingId(r.id)} className="text-xs">編輯</BorderlessButton>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {!p.progress.length ? (
                      <div className="p-6 text-sm text-slate-500">尚無進度紀錄。</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "files" ? (
              <ProjectFilesSection
                files={p.files}
                onAdd={(name, note) => {
                  const row: ProjectFileRow = { id: uid("fil"), name, note, addedAt: todayISO() };
                  props.onUpdate({ files: [row, ...p.files] });
                }}
                onDelete={(id) => props.onUpdate({ files: p.files.filter((f) => f.id !== id) })}
              />
            ) : null}

            <Divider />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">此專案的提示詞</div>
                <BorderlessButton title="新增提示詞" onClick={props.onCreatePrompt}>新提示詞</BorderlessButton>
              </div>

              {props.prompts.length ? (
                <div className="rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_120px_120px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                    <div>提示詞</div>
                    <div>狀態</div>
                    <div className="text-right">操作</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {props.prompts
                      .slice()
                      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                      .map((x) => (
                        <div key={x.id} className="grid grid-cols-[1fr_120px_120px] items-center px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">{x.title}</div>
                            <div className="mt-0.5 text-xs text-slate-500">更新 {x.updatedAt}</div>
                          </div>
                          <div>
                            <Pill label={STATUS_LABEL[x.status]} tone={x.status === "ready" ? "green" : x.status === "needs_review" ? "blue" : x.status === "draft" ? "amber" : "neutral"} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <BorderlessButton title="開啟右側詳情（此頁不含右側，所以直接進入）" onClick={() => props.onOpenPrompt(x.id)} className="text-xs">
                              進入
                            </BorderlessButton>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">此專案尚無提示詞。</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectFilesSection(props: {
  files: ProjectFileRow[];
  onAdd: (name: string, note?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600">檔案上傳（雛形）：以「檔名 + 備註」方式新增；後續可銜接本機資料夾或 Git。</div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="檔名" placeholder="例如：uiux_spec_project_prompt_manager.md" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="備註（可選）" placeholder="用途/來源/版本" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end">
          <PrimaryButton
            title="新增檔案列（雛形，不實際上傳）"
            onClick={() => {
              if (!name.trim()) return;
              props.onAdd(name.trim(), note.trim() || undefined);
              setName("");
              setNote("");
            }}
          >
            新增檔案
          </PrimaryButton>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1fr_1fr_120px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          <div>檔名</div>
          <div>備註</div>
          <div className="text-right">操作</div>
        </div>
        <div className="divide-y divide-slate-200">
          {props.files.map((f) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_120px] items-center px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{f.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">加入 {f.addedAt}</div>
              </div>
              <div className="truncate text-sm text-slate-700">{f.note ?? <span className="text-slate-400">（無）</span>}</div>
              <div className="flex justify-end">
                <BorderlessButton title="刪除此列" onClick={() => props.onDelete(f.id)} className="text-xs">刪除</BorderlessButton>
              </div>
            </div>
          ))}
          {!props.files.length ? <div className="p-6 text-sm text-slate-500">尚無檔案。</div> : null}
        </div>
      </div>
    </div>
  );
}

function PromptEditPage(props: {
  prompt: Prompt | null;
  projects: Project[];
  allTags: string[];
  snippets: Snippet[];
  onBack: () => void;
  onUpdate: (patch: Partial<Prompt>) => void;
  onDelete: () => void;
  onInsertSnippet: (text: string) => void;
}) {
  const p = props.prompt;
  const [tagInput, setTagInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // snippet popover
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [snipOpen, setSnipOpen] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  if (!p) {
    return <EmptyState title="找不到提示詞" hint="此提示詞可能已刪除或尚未建立。" action={<BorderlessButton onClick={props.onBack}>回列表</BorderlessButton>} />;
  }

  const projectName = p.projectId ? props.projects.find((x) => x.id === p.projectId)?.title ?? "（未知）" : "（未指定）";

  return (
    <div className="h-full">
      <PageToolbar
        left={
          <>
            <BorderlessButton title="回到列表" onClick={props.onBack}>← 返回</BorderlessButton>
            <div className="text-sm text-slate-600">提示詞編輯：{p.title}</div>
          </>
        }
        secondaryActions={
          <>
            <BorderlessButton
              title="複製提示詞全文到剪貼簿"
              onClick={async () => {
                const ok = await copyText(p.content);
                setCopied(ok ? "已複製" : "複製失敗");
              }}
            >
              {copied ? copied : "複製全文"}
            </BorderlessButton>
            <button
              ref={btnRef as any}
              onClick={() => setSnipOpen(true)}
              className={cx(
                "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                "border border-transparent bg-transparent",
                "hover:border-slate-200 hover:bg-slate-50",
                "active:bg-slate-100",
                "text-slate-700",
                "transition"
              )}
              title="插入剪貼簿片語到提示詞內容"
              type="button"
            >
              插入片語
            </button>
            <Popover open={snipOpen} onClose={() => setSnipOpen(false)} anchorRef={btnRef as any} width={360}>
              <div className="px-2 py-2">
                <div className="text-xs font-semibold text-slate-600">選擇要插入的片語</div>
                <div className="mt-2 max-h-72 overflow-auto">
                  <div className="space-y-1">
                    {props.snippets.map((s) => (
                      <button
                        key={s.id}
                        className={cx(
                          "w-full rounded-lg px-2 py-2 text-left",
                          "border border-transparent",
                          "hover:border-slate-200 hover:bg-slate-50",
                          "transition"
                        )}
                        onClick={() => {
                          props.onInsertSnippet(s.content);
                          setSnipOpen(false);
                        }}
                        title="點選後插入到提示詞末尾"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900">{s.title}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{s.category} · 更新 {s.updatedAt}</div>
                          </div>
                          <Pill label={s.category} />
                        </div>
                      </button>
                    ))}
                    {!props.snippets.length ? <div className="p-3 text-xs text-slate-500">尚無片語，請先到「剪貼簿」建立。</div> : null}
                  </div>
                </div>
              </div>
            </Popover>
          </>
        }
      primaryAction={
          <PrimaryButton title="完成編輯並返回" onClick={props.onBack}>
            完成
          </PrimaryButton>
        }
      />

      <div className="px-5 py-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-900">{p.title}</div>
                <div className="mt-1 text-xs text-slate-500">專案：{projectName} · 更新：{p.updatedAt}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill label={STATUS_LABEL[p.status]} tone={p.status === "ready" ? "green" : p.status === "needs_review" ? "blue" : p.status === "draft" ? "amber" : "neutral"} />
                  <Pill label={`優先：${PRIORITY_LABEL[p.priority]}`} tone={p.priority === "high" ? "red" : p.priority === "medium" ? "purple" : "neutral"} />
                  {p.tags.map((t) => (
                    <Pill key={t} label={t} />
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DangerButton title="刪除此提示詞" onClick={props.onDelete}>刪除</DangerButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="標題" value={p.title} onChange={(e) => props.onUpdate({ title: e.target.value })} />
              <Select label="專案" value={p.projectId ?? ""} onChange={(e) => props.onUpdate({ projectId: e.target.value || undefined })}>
                <option value="">（未指定）</option>
                {props.projects.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </Select>
              <Select label="狀態" value={p.status} onChange={(e) => props.onUpdate({ status: e.target.value as any })}>
                <option value="draft">草稿</option>
                <option value="needs_review">待優化</option>
                <option value="ready">可用</option>
                <option value="deprecated">停用</option>
                <option value="archived">封存</option>
              </Select>
              <Select label="優先" value={p.priority} onChange={(e) => props.onUpdate({ priority: e.target.value as any })}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </Select>
            </div>

            <Textarea label="摘要（可選，列表顯示用）" value={p.summary ?? ""} onChange={(e) => props.onUpdate({ summary: e.target.value })} rows={3} />

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">標籤</div>
                <div className="text-xs text-slate-500">建議：以固定 vocabulary（例如 UI / RAG / n8n / 規格）</div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <button
                    key={t}
                    className={cx("rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700", "hover:bg-slate-50")}
                    title="點選移除此標籤"
                    onClick={() => props.onUpdate({ tags: p.tags.filter((x) => x !== t) })}
                    type="button"
                  >
                    {t} ✕
                  </button>
                ))}
                {!p.tags.length ? <span className="text-xs text-slate-500">（尚無標籤）</span> : null}
              </div>

              <div className="mt-3 flex items-end gap-2">
                <Input label="新增標籤" placeholder="輸入後按加入" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                <PrimaryButton
                  title="加入標籤"
                  onClick={() => {
                    const v = tagInput.trim();
                    if (!v) return;
                    if (p.tags.includes(v)) return;
                    props.onUpdate({ tags: [...p.tags, v] });
                    setTagInput("");
                  }}
                >
                  加入
                </PrimaryButton>
              </div>

              {props.allTags.length ? (
                <div className="mt-3">
                  <div className="text-xs text-slate-500">常用標籤</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {props.allTags.slice(0, 16).map((t) => (
                      <Pill
                        key={t}
                        label={t}
                        onClick={() => {
                          if (p.tags.includes(t)) return;
                          props.onUpdate({ tags: [...p.tags, t] });
                        }}
                        title="點選加入此標籤"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Textarea label="提示詞內容（Markdown）" value={p.content} onChange={(e) => props.onUpdate({ content: e.target.value })} rows={18} />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              使用方式：將此內容複製貼到 ChatGPT / Gemini 等；後續可接「Markdown 檔案儲存」與「Coding Agent 自動貼標/摘要」。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------
// Boards & Cards
// ------------------------------

function BoardCard(props: {
  prompt: Prompt;
  projectName: string;
  onOpenRight: () => void;
  onEnter: () => void;
  onMove: (next: Status) => void;
}) {
  return (
    <div className={cx("rounded-2xl border border-slate-200 bg-white p-3", "hover:bg-slate-50 transition")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{props.prompt.title}</div>
          <div className="mt-1 text-xs text-slate-500 truncate">{props.projectName} · 更新 {props.prompt.updatedAt}</div>
        </div>
        <Pill label={PRIORITY_LABEL[props.prompt.priority]} tone={props.prompt.priority === "high" ? "red" : props.prompt.priority === "medium" ? "purple" : "neutral"} />
      </div>

      {props.prompt.summary ? <div className="mt-2 line-clamp-2 text-xs text-slate-600">{props.prompt.summary}</div> : null}

      <div className="mt-2 flex flex-wrap gap-1">
        {props.prompt.tags.slice(0, 3).map((t) => (
          <Pill key={t} label={t} />
        ))}
        {props.prompt.tags.length > 3 ? <span className="text-xs text-slate-400">+{props.prompt.tags.length - 3}</span> : null}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BorderlessButton title="開啟右側詳情" onClick={props.onOpenRight} className="text-xs">開右側</BorderlessButton>
          <BorderlessButton title="進入提示詞編輯頁" onClick={props.onEnter} className="text-xs">進入</BorderlessButton>
        </div>
        <select
          value={props.prompt.status}
          onChange={(e) => props.onMove(e.target.value as Status)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
          title="快速移動狀態"
        >
          <option value="draft">草稿</option>
          <option value="needs_review">待優化</option>
          <option value="ready">可用</option>
          <option value="deprecated">停用</option>
          <option value="archived">封存</option>
        </select>
      </div>
    </div>
  );
}

function ProjectStatusBoard(props: {
  projects: Project[];
  promptCountByProjectId: Map<string, number>;
  onOpenProject: (id: string) => void;
  onGoProject: (id: string) => void;
}) {
  const cols: Array<{ key: ProjectStatus; title: string }> = [
    { key: "planned", title: "規劃中" },
    { key: "in_progress", title: "進行中" },
    { key: "paused", title: "暫停" },
    { key: "done", title: "完成" },
  ];

  const by = useMemo(() => {
    const m = new Map<ProjectStatus, Project[]>();
    cols.forEach((c) => m.set(c.key, []));
    props.projects.forEach((p) => m.get(p.status)!.push(p));
    cols.forEach((c) => m.get(c.key)!.sort((a, b) => a.title.localeCompare(b.title)));
    return m;
  }, [props.projects]);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
      {cols.map((c) => {
        const items = by.get(c.key) ?? [];
        return (
          <div key={c.key} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{c.title}</div>
              <div className="text-xs text-slate-500">{items.length}</div>
            </div>
            <div className="space-y-2">
              {items.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-500">提示詞 {props.promptCountByProjectId.get(p.id) ?? 0} · {p.dateRange ?? ""}</div>
                    </div>
                    <Pill label={PROJECT_STATUS_LABEL[p.status]} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.slice(0, 4).map((t) => (
                      <Pill key={t} label={t} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <BorderlessButton title="開啟右側詳情" onClick={() => props.onOpenProject(p.id)} className="text-xs">開右側</BorderlessButton>
                    <BorderlessButton title="進入專案編輯頁" onClick={() => props.onGoProject(p.id)} className="text-xs">進入</BorderlessButton>
                  </div>
                </div>
              ))}
              {!items.length ? <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">無項目</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------
// Detail Panel (right)
// ------------------------------

function DetailPanel(props: {
  route: Route;
  selectedPrompt: Prompt | null;
  selectedProject: Project | null;
  selectedSnippet: Snippet | null;
  projectById: Map<string, Project>;
  onClose: () => void;
  onGoPrompt: (id: string) => void;
  onGoProject: (id: string) => void;
  onUpdatePrompt: (patch: Partial<Prompt>) => void;
  onUpdateProject: (patch: Partial<Project>) => void;
  onCopy: (text: string) => Promise<boolean>;
}) {
  const canUse = props.route.name === "list" || props.route.name === "board" || props.route.name === "clipboard";

  return (
    <div className="fixed right-0 top-0 h-screen w-[360px] border-l border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">詳情</div>
          <BorderlessButton title="關閉右側詳情" onClick={props.onClose} className="text-xs">
            關閉
          </BorderlessButton>
        </div>

        {!canUse ? (
          <div className="p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              目前為「編輯頁」。
              <div className="mt-2 text-xs text-slate-600">此雛形中，右側詳情主要用於列表/看板的快速檢視與輕量調整。</div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-auto p-4">
          {/* Project */}
          {props.selectedProject ? (
            <ProjectDetailCard
              project={props.selectedProject}
              promptCount={Array.from(props.projectById.values()).length}
              onGo={() => props.onGoProject(props.selectedProject!.id)}
              onUpdate={props.onUpdateProject}
              onCopy={props.onCopy}
            />
          ) : null}

          {/* Prompt */}
          {props.selectedPrompt ? (
            <PromptDetailCard
              prompt={props.selectedPrompt}
              projectName={props.selectedPrompt.projectId ? props.projectById.get(props.selectedPrompt.projectId)?.title ?? "（未知）" : "（未指定）"}
              onGo={() => props.onGoPrompt(props.selectedPrompt!.id)}
              onUpdate={props.onUpdatePrompt}
              onCopy={props.onCopy}
            />
          ) : null}

          {/* Snippet */}
          {props.selectedSnippet ? (
            <SnippetDetailCard snippet={props.selectedSnippet} onCopy={props.onCopy} />
          ) : null}

          {!props.selectedProject && !props.selectedPrompt && !props.selectedSnippet ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              尚未選擇項目。請在列表/看板/剪貼簿點選一筆資料，於此檢視。
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProjectDetailCard(props: {
  project: Project;
  promptCount: number;
  onGo: () => void;
  onUpdate: (patch: Partial<Project>) => void;
  onCopy: (text: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(props.project.title);

  useEffect(() => setTitle(props.project.title), [props.project.id]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{props.project.title}</div>
          <div className="mt-1 text-xs text-slate-500">狀態：{PROJECT_STATUS_LABEL[props.project.status]} · {props.project.dateRange ?? ""}</div>
        </div>
        <Pill label={PROJECT_STATUS_LABEL[props.project.status]} tone={props.project.status === "done" ? "green" : props.project.status === "in_progress" ? "blue" : props.project.status === "paused" ? "amber" : "neutral"} />
      </div>

      {props.project.description ? <div className="mt-3 text-sm text-slate-700">{props.project.description}</div> : null}

      <div className="mt-3 space-y-2">
        <Input label="快速改名" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex justify-end gap-2">
          <BorderlessButton title="將變更寫回資料" onClick={() => props.onUpdate({ title })} className="text-xs">套用</BorderlessButton>
          <BorderlessButton title="進入專案編輯頁" onClick={props.onGo} className="text-xs">進入</BorderlessButton>
        </div>
      </div>

      <Divider />

      <div className="mt-3 text-xs text-slate-600">
        快速操作：
        <div className="mt-2 flex flex-wrap gap-2">
          <BorderlessButton
            title="複製專案說明（Markdown）"
            onClick={async () => {
              await props.onCopy(props.project.overviewMarkdown ?? "");
            }}
            className="text-xs"
          >
            複製說明
          </BorderlessButton>
        </div>
      </div>
    </div>
  );
}

function PromptDetailCard(props: {
  prompt: Prompt;
  projectName: string;
  onGo: () => void;
  onUpdate: (patch: Partial<Prompt>) => void;
  onCopy: (text: string) => Promise<boolean>;
}) {
  const [summary, setSummary] = useState(props.prompt.summary ?? "");

  useEffect(() => setSummary(props.prompt.summary ?? ""), [props.prompt.id]);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{props.prompt.title}</div>
          <div className="mt-1 text-xs text-slate-500">專案：{props.projectName} · 更新：{props.prompt.updatedAt}</div>
        </div>
        <Pill label={STATUS_LABEL[props.prompt.status]} tone={props.prompt.status === "ready" ? "green" : props.prompt.status === "needs_review" ? "blue" : props.prompt.status === "draft" ? "amber" : "neutral"} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {props.prompt.tags.slice(0, 6).map((t) => (
          <Pill key={t} label={t} />
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <Textarea label="摘要（快速調整）" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        <div className="flex justify-end gap-2">
          <BorderlessButton title="將摘要寫回資料" onClick={() => props.onUpdate({ summary })} className="text-xs">套用</BorderlessButton>
          <BorderlessButton title="進入提示詞編輯頁" onClick={props.onGo} className="text-xs">進入</BorderlessButton>
        </div>
      </div>

      <Divider />

      <div className="mt-3 flex flex-wrap gap-2">
        <BorderlessButton
          title="複製提示詞全文"
          onClick={async () => {
            await props.onCopy(props.prompt.content);
          }}
          className="text-xs"
        >
          複製全文
        </BorderlessButton>
        <BorderlessButton
          title="複製提示詞標題"
          onClick={async () => {
            await props.onCopy(props.prompt.title);
          }}
          className="text-xs"
        >
          複製標題
        </BorderlessButton>
      </div>
    </div>
  );
}

function SnippetDetailCard(props: { snippet: Snippet; onCopy: (text: string) => Promise<boolean> }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{props.snippet.title}</div>
          <div className="mt-1 text-xs text-slate-500">{props.snippet.category} · 更新：{props.snippet.updatedAt}</div>
        </div>
        <Pill label={props.snippet.category} />
      </div>

      <div className="mt-3">
        <div className="text-xs font-medium text-slate-600">內容（預覽）</div>
        <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          {props.snippet.content || "（空白）"}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <BorderlessButton title="複製內容" onClick={async () => { await props.onCopy(props.snippet.content); }} className="text-xs">
          複製
        </BorderlessButton>
      </div>
    </div>
  );
}
