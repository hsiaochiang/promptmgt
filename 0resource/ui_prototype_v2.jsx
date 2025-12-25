// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Single-file Canvas prototype
 * NOTE: Canvas preview/runtime may not support multi-file imports, so we keep everything in one file.
 * Tailwind classes are used for layout.
 */

type LinkItem = { id: string; title: string; url: string };

type ProgressLog = { id: string; date: string; summary: string; link?: string };

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  /** 最新進度日期（用於左欄快速掃描/排序），可由 progressLogs 推導 */
  progressDate?: string; // YYYY-MM-DD
  /** 專案摘要：通常是本次對話的簡短總結 */
  summary?: string;
  /** 對話/文件連結（ChatGPT、Gemini、VS Code、文件…） */
  links?: LinkItem[];
  /** 進度紀錄：以日期為主鍵的短記錄，方便回顧執行節奏 */
  progressLogs?: ProgressLog[];
};

type Frontmatter = {
  title: string;
  project: string;
  type: string;
  status: string;
  model: string;
  tags: string[];
  note: string;
  updatedAt: string;
  createdAt: string;
};

type PromptItem = {
  id: string;
  fm: Frontmatter;
  preface: string;
  body: string;
};

type SnackbarState = { message: string; undo: null | (() => void) };

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

function nextId(prefix = "x") {
  return `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now().toString(16).slice(-4)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function chipTone(text: string) {
  const t = String(text || "");
  if (t.includes("使用中")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (t.includes("進行中")) return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (t.includes("封存") || t.includes("歸檔")) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatUpdated(ts?: string) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd} ${hh}:${mi}`;
  } catch {
    return String(ts);
  }
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState] as const;
}

function makeFrontmatter(overrides: Partial<Frontmatter> = {}): Frontmatter {
  return {
    title: overrides.title ?? "新草稿",
    project: overrides.project ?? "AI 工作流課程",
    type: overrides.type ?? "其他",
    status: overrides.status ?? "使用中",
    model: overrides.model ?? "gpt-4o-mini",
    tags: overrides.tags ?? [],
    note: overrides.note ?? "",
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

const DEMO_SNIPPETS = [
  { id: "s1", title: "輸出格式", text: "請用條列＋表格整理，並附上資料來源。", tag: "格式" },
  { id: "s2", title: "RAG 約束", text: "請僅根據提供文件回答；不足請明確說明缺口。", tag: "約束" },
  { id: "s3", title: "驗收條件", text: "請補上可驗證的 Acceptance Criteria。", tag: "品質" },
  { id: "s4", title: "語氣", text: "語氣專業、精準、避免過度口語。", tag: "語氣" },
];

const DEMO_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "AI 工作流課程",
    status: "進行中",
    updatedAt: "2025-12-24T05:52:27.836Z",
    progressDate: "2025-12-24",
    summary: "整理課程提示詞、教材、實作步驟與講者備註。",
    links: [
      { id: "l1", title: "ChatGPT 對話", url: "" },
      { id: "l2", title: "Gemini 對話", url: "" },
    ],
    progressLogs: [
      {
        id: "pl1",
        date: "2025-12-24",
        summary: "完成 UI 雛形（Pin、Drawer、歸檔後自動下一筆）與主要動線確認。",
        link: "",
      },
      {
        id: "pl2",
        date: "2025-12-22",
        summary: "建立提示詞 Frontmatter 格式與基本分類方式。",
        link: "",
      },
    ],
  },
  {
    id: "p2",
    name: "客戶提案",
    status: "進行中",
    updatedAt: "2025-12-23T01:10:00.000Z",
    progressDate: "2025-12-23",
    summary: "一頁簡報/報價前需求彙整/技術可行性說明。",
    links: [],
    progressLogs: [
      {
        id: "pl3",
        date: "2025-12-23",
        summary: "整理對外簡報素材與內部討論版架構。",
        link: "",
      },
    ],
  },
];

const DEMO_PROMPTS: Record<string, PromptItem[]> = {
  p1: [
    {
      id: "a1",
      fm: makeFrontmatter({
        title: "新草稿",
        project: "AI 工作流課程",
        note: "test",
        tags: [],
        updatedAt: "2025-12-24T05:52:27.836Z",
        createdAt: "2025-12-22T05:02:04.302+08:00",
      }),
      preface: "（前言）本提示詞用於課程設計與內容整理。",
      body: "# 角色\n你是一位…\n\n# 目標\n請協助我…\n\n# 輸出\n- 條列\n- 表格\n",
    },
    {
      id: "a2",
      fm: makeFrontmatter({ title: "UI/UX Review 提示詞", project: "AI 工作流課程", tags: ["UIUX"], note: "常用" }),
      preface: "（前言）我會提供截圖與流程描述。",
      body: "請先指出 P0/P1/P2 問題，並給出可落地調整規格。",
    },
  ],
  p2: [
    {
      id: "b1",
      fm: makeFrontmatter({ title: "一頁式提案", project: "客戶提案", tags: ["one-pager"], note: "" }),
      preface: "",
      body: "請濃縮為一頁：痛點→解法→效益→工期→成本。",
    },
  ],
};

function Button({
  children,
  variant = "neutral",
  size = "md",
  className,
  title,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  variant?: "neutral" | "primary" | "success" | "warn" | "danger" | "ghost";
  size?: "sm" | "md" | "icon";
  className?: string;
  title?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}) {
  const base = "inline-flex items-center justify-center rounded-full border font-medium transition-colors select-none";
  const sizes: Record<string, string> = { sm: "h-9 px-3 text-sm", md: "h-10 px-3 text-sm", icon: "h-10 w-10" };
  const variants: Record<string, string> = {
    neutral: "bg-white border-slate-200 text-slate-900 hover:bg-slate-50",
    primary: "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700",
    success: "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    warn: "bg-amber-500 border-amber-500 text-white hover:bg-amber-600",
    danger: "bg-rose-600 border-rose-600 text-white hover:bg-rose-700",
    ghost: "bg-transparent border-slate-200 text-slate-900 hover:bg-slate-50",
  };
  return (
    <button
      type="button"
      className={cx(base, sizes[size], variants[variant], disabled ? "opacity-50 pointer-events-none" : "", className)}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PaneRightDrawer({
  title,
  open,
  onClose,
  children,
  width = 440,
  zIndex = 30,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  zIndex?: number;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full bg-white shadow-xl border-l" style={{ width }} role="dialog" aria-modal="true">
        <div className="h-14 px-4 flex items-center justify-between border-b bg-slate-50">
          <div className="font-semibold truncate">{title}</div>
          <Button size="icon" variant="neutral" title="關閉" ariaLabel="關閉" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function OverlayModal({
  title,
  open,
  onClose,
  children,
  maxWidth = 900,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 p-6 grid place-items-center">
        <div className="w-full bg-white rounded-3xl shadow-xl border overflow-hidden" style={{ maxWidth }} role="dialog" aria-modal="true">
          <div className="h-14 px-4 flex items-center justify-between border-b bg-slate-50">
            <div className="font-semibold truncate">{title}</div>
            <Button size="icon" variant="neutral" title="關閉" ariaLabel="關閉" onClick={onClose}>
              ✕
            </Button>
          </div>
          <div className="p-4 max-h-[70vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Snackbar({ state, onClose }: { state: SnackbarState | null; onClose: () => void }) {
  useEffect(() => {
    if (!state) return;
    const t = window.setTimeout(() => onClose(), 3500);
    return () => window.clearTimeout(t);
  }, [state, onClose]);

  if (!state) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-2xl border bg-white shadow-lg px-4 py-3">
        <div className="text-sm text-slate-800 max-w-[70vw] truncate">{state.message}</div>
        {state.undo ? (
          <Button
            size="sm"
            variant="neutral"
            title="復原"
            ariaLabel="復原"
            onClick={() => {
              state.undo?.();
              onClose();
            }}
          >
            Undo
          </Button>
        ) : null}
        <Button size="icon" variant="ghost" title="關閉" ariaLabel="關閉" onClick={onClose}>
          ✕
        </Button>
      </div>
    </div>
  );
}

function App() {
  // Persisted layout widths
  const [leftW, setLeftW] = useLocalStorageState<number>("pmw:leftW", 360);
  const [midW, setMidW] = useLocalStorageState<number>("pmw:midW", 520);

  // Global pin
  const [pinList, setPinList] = useLocalStorageState<boolean>("pmw:pinList", false);

  // UI state
  const [focusMode, setFocusMode] = useState(false);
  const [listVisible, setListVisible] = useState(true);

  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [projectDetailsOpen, setProjectDetailsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [prefaceOpen, setPrefaceOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [promptsByProject, setPromptsByProject] = useState<Record<string, PromptItem[]>>(DEMO_PROMPTS);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? "p1");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(promptsByProject[selectedProjectId]?.[0]?.id ?? null);

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId) ?? null, [projects, selectedProjectId]);
  const promptList = promptsByProject[selectedProjectId] ?? [];
  const selectedPrompt = useMemo(
    () => (promptsByProject[selectedProjectId] ?? []).find((p) => p.id === selectedPromptId) ?? null,
    [promptsByProject, selectedProjectId, selectedPromptId]
  );

  // Keep selected prompt valid when project changes
  useEffect(() => {
    const list = promptsByProject[selectedProjectId] ?? [];
    if (!list.length) {
      setSelectedPromptId(null);
      return;
    }
    if (!list.some((p) => p.id === selectedPromptId)) setSelectedPromptId(list[0].id);
  }, [selectedProjectId, promptsByProject, selectedPromptId]);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const uniqueTypes = useMemo(() => {
    const set = new Set(promptList.map((p) => p.fm.type).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [promptList]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set(promptList.map((p) => p.fm.status).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [promptList]);

  const filteredPrompts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return promptList.filter((p) => {
      if (typeFilter !== "all" && p.fm.type !== typeFilter) return false;
      if (statusFilter !== "all" && p.fm.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${p.fm.title} ${p.fm.note} ${(p.fm.tags || []).join(" ")} ${p.preface} ${p.body}`.toLowerCase();
      return hay.includes(q);
    });
  }, [promptList, search, typeFilter, statusFilter]);

  // Autosave badge (simulated)
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const saveTimer = useRef<number | null>(null);
  const markDirtyAndAutosave = () => {
    setSaveState("dirty");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setSaveState("saving");
      window.setTimeout(() => setSaveState("saved"), 300);
    }, 650);
  };

  const saveBadge = useMemo(() => {
    if (saveState === "saved") return { text: "已儲存", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    if (saveState === "saving") return { text: "儲存中…", cls: "bg-sky-50 text-sky-800 border-sky-200" };
    return { text: "未儲存", cls: "bg-amber-50 text-amber-800 border-amber-200" };
  }, [saveState]);

  // Editor ref for snippet insertion
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  // Resizers
  const dragState = useRef<{ dragging: null | "left" | "mid"; startX: number; startLeft: number; startMid: number }>({
    dragging: null,
    startX: 0,
    startLeft: 0,
    startMid: 0,
  });

  const onPointerDownDivider = (which: "left" | "mid") => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragState.current.dragging = which;
    dragState.current.startX = e.clientX;
    dragState.current.startLeft = leftW;
    dragState.current.startMid = midW;
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      if (dragState.current.dragging === "left") setLeftW(clamp(dragState.current.startLeft + dx, 280, 560));
      if (dragState.current.dragging === "mid") setMidW(clamp(dragState.current.startMid + dx, 380, 820));
    };
    const onUp = () => {
      dragState.current.dragging = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [leftW, midW, setLeftW, setMidW]);

  // Tests (keep + add)
  useEffect(() => {
    const id1 = nextId("t");
    const id2 = nextId("t");
    console.assert(id1 !== id2, "nextId should generate different values");
    console.assert(clamp(999, 1, 10) === 10, "clamp should cap to max");
    console.assert(chipTone("使用中").includes("emerald"), "chipTone should map 使用中 to emerald");
    // Added test
    console.assert(typeof (promptList[0]?.fm?.title ?? "") === "string", "prompt title should be string");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Behaviors
  const closeAllOverlays = () => {
    setSnippetsOpen(false);
    setMetaOpen(false);
    setProjectDetailsOpen(false);
    setHelpOpen(false);
  };

  const onClickProject = (pid: string) => {
    if (pid === selectedProjectId) {
      if (!listVisible) setListVisible(true);
      return;
    }
    setSelectedProjectId(pid);
    setListVisible(true);
    setPrefaceOpen(false);
  };

  const selectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setPrefaceOpen(false);
    if (!pinList) setListVisible(false);
  };

  const effectiveListVisible = !focusMode && listVisible;

  const setPromptBody = (body: string) => {
    if (!selectedPrompt) return;
    setPromptsByProject((prev) => {
      const list = prev[selectedProjectId] ?? [];
      return {
        ...prev,
        [selectedProjectId]: list.map((p) => (p.id === selectedPrompt.id ? { ...p, body, fm: { ...p.fm, updatedAt: new Date().toISOString() } } : p)),
      };
    });
    markDirtyAndAutosave();
  };

  const setPromptPreface = (preface: string) => {
    if (!selectedPrompt) return;
    setPromptsByProject((prev) => {
      const list = prev[selectedProjectId] ?? [];
      return {
        ...prev,
        [selectedProjectId]: list.map((p) => (p.id === selectedPrompt.id ? { ...p, preface, fm: { ...p.fm, updatedAt: new Date().toISOString() } } : p)),
      };
    });
    markDirtyAndAutosave();
  };

  const setPromptFM = (patch: Partial<Frontmatter>) => {
    if (!selectedPrompt) return;
    setPromptsByProject((prev) => {
      const list = prev[selectedProjectId] ?? [];
      return {
        ...prev,
        [selectedProjectId]: list.map((p) => (p.id === selectedPrompt.id ? { ...p, fm: { ...p.fm, ...patch, updatedAt: new Date().toISOString() } } : p)),
      };
    });
    markDirtyAndAutosave();
  };

  const createPrompt = () => {
    const id = nextId("pr");
    const projectName = selectedProject?.name ?? "";
    const p: PromptItem = {
      id,
      fm: makeFrontmatter({ title: "新草稿", project: projectName, tags: [] }),
      preface: "",
      body: "",
    };
    setPromptsByProject((prev) => ({ ...prev, [selectedProjectId]: [p, ...(prev[selectedProjectId] ?? [])] }));
    setSelectedPromptId(id);
    setPrefaceOpen(false);
    if (!pinList) setListVisible(false);
    setSnackbar({ message: "已新增提示詞（已開啟編輯）", undo: null });
  };

  const duplicatePrompt = () => {
    if (!selectedPrompt) return;
    const id = nextId("dup");
    const copy: PromptItem = {
      ...selectedPrompt,
      id,
      fm: { ...selectedPrompt.fm, title: `${selectedPrompt.fm.title}（複製）`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    };
    setPromptsByProject((prev) => ({ ...prev, [selectedProjectId]: [copy, ...(prev[selectedProjectId] ?? [])] }));
    setSelectedPromptId(id);
    setPrefaceOpen(false);
    if (!pinList) setListVisible(false);
    setSnackbar({ message: "已建立副本（另存為）", undo: null });
  };

  const pickNextAfterRemove = (removedId: string) => {
    const list = promptsByProject[selectedProjectId] ?? [];
    const idx = list.findIndex((p) => p.id === removedId);
    return list[idx + 1] ?? list[idx - 1] ?? null;
  };

  const removePrompt = (mode: "archive" | "delete") => {
    if (!selectedPrompt) return;
    const removed = selectedPrompt;
    const next = pickNextAfterRemove(removed.id);

    setPromptsByProject((prev) => ({ ...prev, [selectedProjectId]: (prev[selectedProjectId] ?? []).filter((p) => p.id !== removed.id) }));
    setSelectedPromptId(next?.id ?? null);
    setPrefaceOpen(false);

    setSnackbar({
      message: `${mode === "archive" ? "已歸檔" : "已刪除"}：${removed.fm.title}（已自動切換下一筆）`,
      undo: () => {
        setPromptsByProject((prev) => ({ ...prev, [selectedProjectId]: [removed, ...(prev[selectedProjectId] ?? [])] }));
        setSelectedPromptId(removed.id);
      },
    });
  };

  const copyToClipboard = async () => {
    if (!selectedPrompt) return;
    try {
      await navigator.clipboard.writeText(selectedPrompt.body);
      setSnackbar({ message: "已複製到剪貼簿", undo: null });
    } catch {
      setSnackbar({ message: "複製失敗：瀏覽器限制", undo: null });
    }
  };

  const insertSnippet = (text: string) => {
    const el = editorRef.current;
    if (!el || !selectedPrompt) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = selectedPrompt.body.slice(0, start);
    const after = selectedPrompt.body.slice(end);
    const next = before + text + after;
    setPromptBody(next);
    requestAnimationFrame(() => {
      const pos = start + text.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const updateProject = (pid: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === pid ? { ...p, ...patch } : p)));
  };

  const computeLatestProgressDate = (logs?: ProgressLog[]) => {
    const list = (logs ?? []).filter((x) => (x.date || "").trim().length > 0);
    if (!list.length) return "";
    // Date string is YYYY-MM-DD; lexical sort works
    return list.map((x) => x.date).sort().slice(-1)[0] ?? "";
  };

  const addProjectLog = (pid: string) => {
    const id = nextId("pl");
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        const logs = [...(p.progressLogs ?? []), { id, date: "", summary: "", link: "" }];
        const latest = computeLatestProgressDate(logs);
        return { ...p, progressLogs: logs, progressDate: latest || p.progressDate };
      })
    );
  };

  const updateProjectLog = (pid: string, logId: string, patch: Partial<ProgressLog>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        const logs = (p.progressLogs ?? []).map((l) => (l.id === logId ? { ...l, ...patch } : l));
        const latest = computeLatestProgressDate(logs);
        return { ...p, progressLogs: logs, progressDate: latest || p.progressDate };
      })
    );
  };

  const removeProjectLog = (pid: string, logId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        const logs = (p.progressLogs ?? []).filter((l) => l.id !== logId);
        const latest = computeLatestProgressDate(logs);
        return { ...p, progressLogs: logs, progressDate: latest || "" };
      })
    );
  };

  const addProjectLink = (pid: string) => {
    const id = nextId("link");
    setProjects((prev) =>
      prev.map((p) =>
        p.id === pid
          ? {
              ...p,
              links: [...(p.links ?? []), { id, title: "新連結", url: "" }],
            }
          : p
      )
    );
  };

  const updateProjectLink = (pid: string, lid: string, patch: Partial<LinkItem>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        const links = (p.links ?? []).map((l) => (l.id === lid ? { ...l, ...patch } : l));
        return { ...p, links };
      })
    );
  };

  const removeProjectLink = (pid: string, lid: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        return { ...p, links: (p.links ?? []).filter((l) => l.id !== lid) };
      })
    );
  };

  const wordCount = useMemo(() => {
    const s = selectedPrompt?.body ?? "";
    const trimmed = s.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/g).length;
  }, [selectedPrompt?.body]);

  const rootText = "text-[18px] leading-7"; // +2px baseline

  return (
    <div className={cx("h-screen w-full bg-slate-100", rootText)}>
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-slate-900" />
          <div className="min-w-0">
            <div className="font-semibold truncate">Prompt Management Workspace</div>
            <div className="text-xs text-slate-500 truncate">外接寬螢幕（1920×1440）動線原型</div>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span>選取/焦點</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>新增/建立</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>歸檔</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span>刪除</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant={focusMode ? "primary" : "neutral"}
            title="專注編輯：隱藏左/中區，最大化右側編輯"
            ariaLabel="專注編輯"
            onClick={() => {
              setFocusMode((v) => !v);
              setListVisible(false);
              setPrefaceOpen(false);
              closeAllOverlays();
            }}
          >
            {focusMode ? "退出專注" : "專注編輯"}
          </Button>

          <Button
            size="md"
            variant="neutral"
            title="專案說明頁：對話連結 / 摘要 / 進度日期"
            ariaLabel="專案說明"
            onClick={() => {
              closeAllOverlays();
              setProjectDetailsOpen(true);
            }}
          >
            專案說明
          </Button>

          <Button
            size="md"
            variant="neutral"
            title="常用片語（右側抽屜）：點擊插入到游標位置"
            ariaLabel="片語"
            onClick={() => {
              setHelpOpen(false);
              setProjectDetailsOpen(false);
              setMetaOpen(false);
              setSnippetsOpen((v) => !v);
            }}
          >
            片語
          </Button>

          <Button
            size="icon"
            variant={pinList ? "primary" : "neutral"}
            title={pinList ? "釘住：列表固定顯示" : "未釘住：選取提示詞後自動收合列表"}
            ariaLabel="釘住"
            onClick={() => {
              setPinList((v) => !v);
              if (!pinList) setListVisible(true);
            }}
          >
            📌
          </Button>

          <Button
            size="icon"
            variant="neutral"
            title="按鈕用途與動線說明"
            ariaLabel="說明"
            onClick={() => {
              closeAllOverlays();
              setHelpOpen(true);
            }}
          >
            ?
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: projects */}
        <aside className={cx("shrink-0 border-r bg-white overflow-hidden flex flex-col", focusMode && "hidden")} style={{ width: leftW }}>
          <div className="h-12 px-3 flex items-center justify-between border-b">
            <div className="font-semibold">專案</div>
            <Button size="icon" variant="neutral" title="新增專案（原型未實作）" ariaLabel="新增專案" onClick={() => setSnackbar({ message: "原型：新增專案未實作", undo: null })}>
              ＋
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {projects.map((p) => {
              const active = selectedProjectId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cx(
                    "w-full text-left rounded-2xl border p-3 hover:bg-slate-50 transition-colors",
                    active ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200"
                  )}
                  title="點同一專案可叫回中欄列表"
                  onClick={() => onClickProject(p.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-2xl bg-slate-100 grid place-items-center">📁</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 min-w-0">
                        <span className={cx("px-2 py-0.5 rounded-full border", chipTone(p.status))}>{p.status}</span>
                        <span className="truncate">進度：{p.progressDate || "—"}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {!focusMode ? (
          <div className="w-[6px] cursor-col-resize bg-slate-200/70 hover:bg-slate-300" onPointerDown={onPointerDownDivider("left")} title="拖曳調整左欄寬度" />
        ) : null}

        {/* Middle: prompt list */}
        {effectiveListVisible && !focusMode ? (
          <main className="shrink-0 border-r bg-slate-50 overflow-hidden flex flex-col" style={{ width: midW }}>
            <div className="h-12 px-3 flex items-center justify-between border-b bg-white">
              <div className="min-w-0">
                <div className="font-semibold truncate">提示詞列表</div>
                <div className="text-xs text-slate-500 truncate">專案：{selectedProject?.name ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="success" title="新增提示詞並開啟編輯" ariaLabel="新增" onClick={createPrompt}>
                  ＋新增
                </Button>
                <Button
                  size="sm"
                  variant="neutral"
                  title="清除搜尋與篩選"
                  ariaLabel="清除"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  清除
                </Button>
              </div>
            </div>

            <div className="px-3 py-3 border-b bg-white">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋（標題/內容/標籤/備註）"
                className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-11 px-3 rounded-2xl border bg-white text-[16px]">
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "類型：全部" : t}
                    </option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 px-3 rounded-2xl border bg-white text-[16px]">
                  {uniqueStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "狀態：全部" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-2">
              {filteredPrompts.length === 0 ? <div className="text-sm text-slate-500 p-3">查無符合的提示詞。</div> : null}
              {filteredPrompts.map((p) => {
                const active = p.id === selectedPromptId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={cx(
                      "w-full text-left p-3 rounded-2xl border bg-white hover:bg-slate-50 transition-colors",
                      active ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200"
                    )}
                    onClick={() => selectPrompt(p.id)}
                    title="點擊開啟右欄編輯（Pin OFF 會收合中欄）"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cx("h-10 w-10 rounded-2xl grid place-items-center border", chipTone(p.fm.status))}>✎</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="font-semibold truncate">{p.fm.title}</div>
                          <span className="text-xs text-slate-500 shrink-0">{formatUpdated(p.fm.updatedAt)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(p.fm.tags || []).slice(0, 4).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 truncate">{p.fm.note || "—"}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </main>
        ) : (
          !focusMode && (
            <div className="w-[14px] bg-slate-200/60 border-r flex items-center justify-center">
              <button
                type="button"
                className="h-24 w-[10px] rounded-full bg-white border border-slate-300 hover:bg-slate-50"
                title="顯示提示詞列表（可點可叫回）"
                aria-label="顯示提示詞列表"
                onClick={() => setListVisible(true)}
              />
            </div>
          )
        )}

        {!focusMode && effectiveListVisible ? (
          <div className="w-[6px] cursor-col-resize bg-slate-200/70 hover:bg-slate-300" onPointerDown={onPointerDownDivider("mid")} title="拖曳調整中欄寬度" />
        ) : null}

        {/* Right: editor */}
        <section className="flex-1 min-w-0 bg-white overflow-hidden relative">
          <div className="h-12 px-4 flex items-center justify-between border-b bg-white">
            <div className="min-w-0">
              <div className="font-semibold truncate">{selectedPrompt?.fm.title ?? "（未選取提示詞）"}</div>
              <div className="text-xs text-slate-500 truncate">
                {selectedProject?.name ?? "—"} · {wordCount} words
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cx("px-3 py-1 rounded-full border text-sm", saveBadge.cls)}>{saveBadge.text}</span>

              <Button size="sm" variant="neutral" title="複製正文到剪貼簿" ariaLabel="複製" onClick={copyToClipboard} disabled={!selectedPrompt}>
                複製
              </Button>
              <Button size="sm" variant="neutral" title="另存為：建立副本" ariaLabel="另存為" onClick={duplicatePrompt} disabled={!selectedPrompt}>
                另存為
              </Button>
              <Button size="sm" variant="warn" title="歸檔（可 Undo；會自動切下一筆）" ariaLabel="歸檔" onClick={() => removePrompt("archive")} disabled={!selectedPrompt}>
                歸檔
              </Button>
              <Button size="sm" variant="danger" title="刪除（可 Undo；會自動切下一筆）" ariaLabel="刪除" onClick={() => removePrompt("delete")} disabled={!selectedPrompt}>
                刪除
              </Button>

              <Button
                size="icon"
                variant={metaOpen ? "primary" : "neutral"}
                title="中繼資料 Drawer（Frontmatter）"
                ariaLabel="中繼資料"
                onClick={() => {
                  setHelpOpen(false);
                  setProjectDetailsOpen(false);
                  setSnippetsOpen(false);
                  setMetaOpen((v) => !v);
                }}
                disabled={!selectedPrompt}
              >
                ⚙️
              </Button>
            </div>
          </div>

          <div className="h-[calc(100%-48px)] overflow-auto p-4">
            {!selectedPrompt ? (
              <div className="h-full grid place-items-center text-slate-500">請先選擇或新增一筆提示詞。</div>
            ) : (
              <div className="max-w-[1200px]">
                {/* Preface */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="font-semibold">前言（每筆提示詞）</div>
                    <Button size="sm" variant={prefaceOpen ? "primary" : "neutral"} title={prefaceOpen ? "收起前言" : "展開前言"} ariaLabel="前言" onClick={() => setPrefaceOpen((v) => !v)}>
                      {prefaceOpen ? "收起" : "展開"}
                    </Button>
                  </div>
                  {prefaceOpen ? (
                    <div className="px-4 pb-4">
                      <textarea
                        className="w-full min-h-[120px] rounded-2xl border bg-white p-3 text-[16px] leading-7"
                        value={selectedPrompt.preface}
                        onChange={(e) => setPromptPreface(e.target.value)}
                        placeholder="每筆提示詞的前言（預設收合）"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Main editor */}
                <div className="mt-4 rounded-3xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between bg-white">
                    <div className="font-semibold">目前編輯中</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="neutral" title="顯示/隱藏提示詞列表" ariaLabel="列表" onClick={() => setListVisible((v) => !v)}>
                        {effectiveListVisible ? "隱藏列表" : "顯示列表"}
                      </Button>
                      <Button
                        size="sm"
                        variant="neutral"
                        title="開啟/關閉常用片語 Drawer"
                        ariaLabel="片語"
                        onClick={() => {
                          setHelpOpen(false);
                          setProjectDetailsOpen(false);
                          setMetaOpen(false);
                          setSnippetsOpen((v) => !v);
                        }}
                      >
                        片語
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50">
                    {/* Prototype uses textarea; replace with CodeMirror in your repo */}
                    <textarea
                      ref={editorRef}
                      className="w-full min-h-[520px] rounded-2xl border bg-white p-3 text-[16px] leading-7"
                      value={selectedPrompt.body}
                      onChange={(e) => setPromptBody(e.target.value)}
                      placeholder="在此編輯提示詞正文（可改為 @uiw/react-codemirror）"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right drawers */}
          <PaneRightDrawer title="中繼資料（Frontmatter）" open={metaOpen} onClose={() => setMetaOpen(false)} width={460} zIndex={30}>
            {!selectedPrompt ? (
              <div className="text-slate-500">尚未選取提示詞。</div>
            ) : (
              <div className="space-y-4">
                <Field label="title" hint="右上標題會即時更新">
                  <input className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]" value={selectedPrompt.fm.title} onChange={(e) => setPromptFM({ title: e.target.value })} />
                </Field>
                <Field label="project">
                  <input className="w-full h-11 px-4 rounded-2xl border bg-slate-50 text-[16px]" value={selectedPrompt.fm.project} readOnly />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="type">
                    <input className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]" value={selectedPrompt.fm.type} onChange={(e) => setPromptFM({ type: e.target.value })} />
                  </Field>
                  <Field label="status">
                    <input className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]" value={selectedPrompt.fm.status} onChange={(e) => setPromptFM({ status: e.target.value })} />
                  </Field>
                </div>
                <Field label="model">
                  <input className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]" value={selectedPrompt.fm.model} onChange={(e) => setPromptFM({ model: e.target.value })} />
                </Field>
                <Field label="tags" hint="用逗號分隔">
                  <input
                    className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]"
                    value={(selectedPrompt.fm.tags || []).join(", ")}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setPromptFM({ tags });
                    }}
                  />
                </Field>
                <Field label="note">
                  <textarea className="w-full min-h-[100px] rounded-2xl border bg-white p-3 text-[16px] leading-7" value={selectedPrompt.fm.note} onChange={(e) => setPromptFM({ note: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="updatedAt">
                    <input className="w-full h-11 px-4 rounded-2xl border bg-slate-50 text-[16px]" value={selectedPrompt.fm.updatedAt} readOnly />
                  </Field>
                  <Field label="createdAt">
                    <input className="w-full h-11 px-4 rounded-2xl border bg-slate-50 text-[16px]" value={selectedPrompt.fm.createdAt} readOnly />
                  </Field>
                </div>
              </div>
            )}
          </PaneRightDrawer>

          <PaneRightDrawer title="常用片語（點擊插入游標）" open={snippetsOpen} onClose={() => setSnippetsOpen(false)} width={420} zIndex={40}>
            <div className="space-y-2">
              {DEMO_SNIPPETS.map((s) => (
                <button key={s.id} type="button" className="w-full text-left p-3 rounded-2xl border bg-white hover:bg-slate-50" onClick={() => insertSnippet(s.text)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{s.title}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">{s.tag}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2">{s.text}</div>
                </button>
              ))}
            </div>
          </PaneRightDrawer>

          {/* Modals */}
          <OverlayModal title="專案說明" open={projectDetailsOpen} onClose={() => setProjectDetailsOpen(false)} maxWidth={980}>
            {!selectedProject ? (
              <div className="text-slate-500">尚未選取專案。</div>
            ) : (
              <div className="space-y-8">
                {/* 基本資訊 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">基本資訊</div>
                    <div className="text-xs text-slate-500">用途：把對話連結、摘要、進度點集中在專案內</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="專案名稱">
                      <input
                        className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]"
                        value={selectedProject.name}
                        onChange={(e) => updateProject(selectedProject.id, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="最新進度日期" hint="左欄顯示/用於快速掃描">
                      <input
                        className="w-full h-11 px-4 rounded-2xl border bg-slate-50 text-[16px]"
                        value={selectedProject.progressDate || ""}
                        readOnly
                      />
                    </Field>
                  </div>

                  <Field label="摘要" hint="貼上本次對話簡短總結（建議 3～6 行）">
                    <textarea
                      className="w-full min-h-[140px] rounded-2xl border bg-white p-3 text-[16px] leading-7"
                      value={selectedProject.summary || ""}
                      onChange={(e) => updateProject(selectedProject.id, { summary: e.target.value })}
                      placeholder="例如：完成 UI 動線確認、確立 Pin 行為、Meta/片語 Drawer 規格…"
                    />
                  </Field>
                </div>

                {/* 連結 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">對話/文件連結</div>
                    <Button size="sm" variant="success" title="新增連結" ariaLabel="新增連結" onClick={() => addProjectLink(selectedProject.id)}>
                      ＋新增連結
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(selectedProject.links ?? []).length === 0 ? <div className="text-slate-500 text-sm">尚無連結。</div> : null}
                    {(selectedProject.links ?? []).map((l) => (
                      <div key={l.id} className="rounded-2xl border bg-slate-50 p-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <input
                              className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]"
                              value={l.title}
                              onChange={(e) => updateProjectLink(selectedProject.id, l.id, { title: e.target.value })}
                              placeholder="標題（ChatGPT / Gemini / 文件…）"
                            />
                          </div>
                          <div className="col-span-7">
                            <input
                              className="w-full h-11 px-4 rounded-2xl border bg-white text-[16px]"
                              value={l.url}
                              onChange={(e) => updateProjectLink(selectedProject.id, l.id, { url: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button size="icon" variant="danger" title="移除" ariaLabel="移除" onClick={() => removeProjectLink(selectedProject.id, l.id)}>
                              🗑️
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 進度紀錄 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">進度紀錄（日期 → 簡短記錄）</div>
                    <Button size="sm" variant="success" title="新增一筆進度" ariaLabel="新增進度" onClick={() => addProjectLog(selectedProject.id)}>
                      ＋新增進度
                    </Button>
                  </div>
                  <div className="text-xs text-slate-500">建議每次討論/決策都留一筆：日期、做了什麼、（可選）對話連結。</div>

                  {(selectedProject.progressLogs ?? []).length === 0 ? (
                    <div className="text-slate-500 text-sm">尚無進度紀錄。</div>
                  ) : (
                    <div className="space-y-3">
                      {(selectedProject.progressLogs ?? [])
                        .slice()
                        .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
                        .map((log) => (
                          <div key={log.id} className="rounded-2xl border bg-white p-3">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-2">
                                <input
                                  className="w-full h-11 px-3 rounded-2xl border bg-white text-[16px]"
                                  value={log.date}
                                  onChange={(e) => updateProjectLog(selectedProject.id, log.id, { date: e.target.value })}
                                  placeholder="YYYY-MM-DD"
                                />
                              </div>
                              <div className="col-span-7">
                                <input
                                  className="w-full h-11 px-3 rounded-2xl border bg-white text-[16px]"
                                  value={log.summary}
                                  onChange={(e) => updateProjectLog(selectedProject.id, log.id, { summary: e.target.value })}
                                  placeholder="這一天完成/決定了什麼（保持短句）"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  className="w-full h-11 px-3 rounded-2xl border bg-white text-[16px]"
                                  value={log.link || ""}
                                  onChange={(e) => updateProjectLog(selectedProject.id, log.id, { link: e.target.value })}
                                  placeholder="可選：連結"
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <Button size="icon" variant="danger" title="移除" ariaLabel="移除進度" onClick={() => removeProjectLog(selectedProject.id, log.id)}>
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </OverlayModal>

          <OverlayModal title="操作說明（按鈕用途）" open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth={980}>
            <div className="space-y-6 text-sm text-slate-700">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="font-semibold">整體動線（你日常的節奏）</div>
                <ol className="mt-2 list-decimal pl-5 space-y-1">
                  <li>左欄選專案 → 中欄出現提示詞列表（可搜尋/篩選）</li>
                  <li>點一筆提示詞 → 右欄編輯（Pin OFF 會收合中欄，最大化編輯）</li>
                  <li>需要切下一筆：歸檔/刪除後自動跳下一筆；或把中欄叫回再選</li>
                </ol>
              </div>

              <div>
                <div className="font-semibold">頂部 Header 按鈕</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">專注編輯</div>
                    <div className="text-xs text-slate-500">隱藏左/中欄（最大化右欄）；同時關閉所有 Drawer/Modal。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">專案說明</div>
                    <div className="text-xs text-slate-500">開啟專案頁：摘要、連結、進度紀錄；進度日期會回寫到左欄顯示。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">片語</div>
                    <div className="text-xs text-slate-500">右側 Drawer（overlay）開關；點擊片語會插入至游標位置。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">📌 釘住</div>
                    <div className="text-xs text-slate-500">全域開關。OFF：點提示詞後自動收合中欄；ON：列表固定顯示。</div>
                  </div>
                  <div className="rounded-2xl border p-3 col-span-2">
                    <div className="font-semibold">?</div>
                    <div className="text-xs text-slate-500">開啟本說明頁（所有按鈕的用途集中在這裡）。</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold">左欄（專案）</div>
                <ul className="mt-2 list-disc pl-5 space-y-2">
                  <li>點同一專案一次：若中欄已隱藏，會把列表叫回（保持你的編輯節奏）。</li>
                  <li>左欄卡片顯示「進度日期」：來自專案頁的進度紀錄（以最新日期為主）。</li>
                  <li>「＋」新增專案：此原型未實作（未連檔案系統）。</li>
                </ul>
              </div>

              <div>
                <div className="font-semibold">中欄（提示詞列表）</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">＋新增</div>
                    <div className="text-xs text-slate-500">建立新提示詞並立即開啟右欄編輯；Pin OFF 時中欄會收合。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">清除</div>
                    <div className="text-xs text-slate-500">清空搜尋與篩選（回到全列表）。</div>
                  </div>
                  <div className="rounded-2xl border p-3 col-span-2">
                    <div className="font-semibold">搜尋 / 類型 / 狀態</div>
                    <div className="text-xs text-slate-500">用於快速定位；建議搭配 tags、note 做管理。</div>
                  </div>
                  <div className="rounded-2xl border p-3 col-span-2">
                    <div className="font-semibold">列表小把手</div>
                    <div className="text-xs text-slate-500">中欄收合時仍保留一個可點擊的把手，用來快速叫回列表。</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold">右欄（編輯區）</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">複製</div>
                    <div className="text-xs text-slate-500">把提示詞正文複製到剪貼簿（用於貼到 ChatGPT/Gemini）。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">另存為</div>
                    <div className="text-xs text-slate-500">建立副本（常用於不同模型/不同語氣的分支版本）。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">歸檔</div>
                    <div className="text-xs text-slate-500">移出目前列表（示意）；會自動切換到下一筆，並提供 Undo。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">刪除</div>
                    <div className="text-xs text-slate-500">刪除目前提示詞（示意）；會自動切換到下一筆，並提供 Undo。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">⚙️ 中繼資料</div>
                    <div className="text-xs text-slate-500">右欄內第二個 Drawer：編輯 Frontmatter 欄位（title/type/status/model/tags/note）。</div>
                  </div>
                  <div className="rounded-2xl border p-3">
                    <div className="font-semibold">前言（展開/收起）</div>
                    <div className="text-xs text-slate-500">每筆提示詞自己的前言；預設收起（你主要寫正文）。</div>
                  </div>
                  <div className="rounded-2xl border p-3 col-span-2">
                    <div className="font-semibold">隱藏/顯示列表</div>
                    <div className="text-xs text-slate-500">右欄內的快捷開關（不依賴 Pin），方便你邊寫邊切。</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="font-semibold">顏色提示（動線）</div>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-slate-600">
                  <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500 mr-2" />選取/焦點（目前正在看的專案/提示詞）</li>
                  <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />新增/建立（建立新提示詞、新增連結、新增進度）</li>
                  <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 mr-2" />歸檔（維持節奏：做完就歸檔並跳下一筆）</li>
                  <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 mr-2" />刪除（高風險操作：建議正式版加確認）</li>
                </ul>
              </div>
            </div>
          </OverlayModal>
        </section>
      </div>

      <Snackbar state={snackbar} onClose={() => setSnackbar(null)} />
    </div>
  );
}

export default function Index() {
  return <App />;
}
