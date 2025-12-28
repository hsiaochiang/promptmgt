"use client";

import React from "react";
import TopBar from "./components/top-bar";
import ProjectList from "./components/project-list";
import InboxList from "./components/inbox-list";
import PromptList from "./components/prompt-list";
import PromptHeader from "./components/prompt-header";
import PromptEditor from "./components/prompt-editor";
import ChangeReportModal, { ChangeReportItem } from "./components/change-report-modal";
import SnippetPanel from "./components/snippet-panel";
import DraftEditor from "./components/draft-editor";
import TabPlaceholders from "./components/tab-placeholders";
import Scratchpad from "./components/scratchpad";
import SnackbarUndo from "./components/snackbar-undo";
import { AsyncBoundary, ErrorBoundary } from "./components/error-boundary";
import ProjectReadme from "./components/project-readme";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxItem, PromptFrontmatter, Project, PromptStatus, PromptType, Snippet } from "@/lib/types/schema";
import RootPathAlert from "./components/root-path-alert";
import { useWorkspaceStore } from "./store/useWorkspaceStore";
import { useSnippetInsert } from "./hooks/useSnippetInsert";
import FrontmatterAccordion from "./components/frontmatter-accordion";
import { useWorkspaceHotkeys } from "./hooks/useWorkspaceHotkeys";

export default function WorkspaceShell() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
  const [inboxRefreshKey, setInboxRefreshKey] = useState(0);
  const [creatingPrompt, setCreatingPrompt] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const selectedPromptId = useWorkspaceStore((s) => s.selectedPromptId);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const setSelectedProjectId = useWorkspaceStore((s) => s.setSelectedProjectId);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);
  const selectedProjectId = useWorkspaceStore((s) => s.selectedProjectId);
  const activeTab = useWorkspaceStore((s) => s.activeTab);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);
  const [promptRefreshKey, setPromptRefreshKey] = useState(0);
  const [promptsKpi, setPromptsKpi] = useState({ total: 0, inUse: 0, draft: 0, archived: 0 });

  const [promptFrontmatter, setPromptFrontmatter] = useState<PromptFrontmatter | null>(null);
  const [promptBody, setPromptBody] = useState<string>("");
  const [promptHash, setPromptHash] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptDamaged, setPromptDamaged] = useState(false);
  const [promptParseErrorCode, setPromptParseErrorCode] = useState<string | null>(null);
  const [promptParseErrorMessage, setPromptParseErrorMessage] = useState<string | null>(null);
  const [pendingInsert, setPendingInsert] = useState<string | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoMessage, setUndoMessage] = useState("已排程刪除，可在 5 秒內撤銷");
  const undoRef = useRef<() => void>(() => {});
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { insertSnippet } = useSnippetInsert((content) => setPendingInsert(content));
  const inboxCount = useWorkspaceStore((s) => s.inboxCount);
  const focusMode = useWorkspaceStore((s) => s.focusMode);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  const setFocusModeState = useWorkspaceStore((s) => s.setFocusMode);
  const isSnippetPanelOpen = useWorkspaceStore((s) => s.isSnippetPanelOpen);
  const toggleSnippetPanel = useWorkspaceStore((s) => s.toggleSnippetPanel);
  const pinned = useWorkspaceStore((s) => s.pinned);
  const setPinned = useWorkspaceStore((s) => s.setPinned);
  const listCollapsed = useWorkspaceStore((s) => s.listCollapsed);
  const setListCollapsed = useWorkspaceStore((s) => s.setListCollapsed);
  const toggleListCollapsed = useWorkspaceStore((s) => s.toggleListCollapsed);
  const layout = useWorkspaceStore((s) => s.layout);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const hydratePreferences = useWorkspaceStore((s) => s.hydratePreferences);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [leftWidth, setLeftWidth] = useState<number>(layout.leftWidth ?? 320);
  const [middleWidth, setMiddleWidth] = useState<number>(layout.middleWidth ?? 520);
  const leftWidthRef = useRef(leftWidth);
  const middleWidthRef = useRef(middleWidth);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const list = await res.json();
      setProjects(list);
      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(list[0].name);
      }
    } catch {
      // noop
    }
  }, [selectedProjectId, setSelectedProjectId]);

  const loadPrompt = useCallback(async () => {
    if (!selectedPromptId) {
      setPromptFrontmatter(null);
      setPromptBody("");
      setPromptHash(null);
      setPromptLoading(false);
      setPromptError(null);
      setPromptDamaged(false);
      setPromptParseErrorCode(null);
      setPromptParseErrorMessage(null);
      return;
    }
    setPromptLoading(true);
    setPromptError(null);
    try {
      const res = await fetch(`/api/prompts/${selectedPromptId}`);
      if (!res.ok) {
        throw new Error("無法讀取提示詞");
      }
      const data = await res.json();
      setPromptFrontmatter(data.frontmatter);
      setPromptBody(data.body);
      setPromptHash(data.hash);
      setPromptDamaged(!!data.damaged);
      setPromptParseErrorCode(data.errorCode ?? null);
      setPromptParseErrorMessage(data.errorMessage ?? null);
      setEditorDirty(false);
    } catch (err) {
      setPromptError(err instanceof Error ? err.message : "讀取失敗");
    } finally {
      setPromptLoading(false);
    }
  }, [selectedPromptId, setEditorDirty]);

  useEffect(() => {
    hydratePreferences();
    setLeftWidth(layout.leftWidth ?? 320);
    setMiddleWidth(layout.middleWidth ?? 520);
    leftWidthRef.current = layout.leftWidth ?? 320;
    middleWidthRef.current = layout.middleWidth ?? 520;
  }, [hydratePreferences, layout.leftWidth, layout.middleWidth]);

  useEffect(() => {
    leftWidthRef.current = leftWidth;
  }, [leftWidth]);

  useEffect(() => {
    middleWidthRef.current = middleWidth;
  }, [middleWidth]);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  useEffect(() => {
    if (activeTab === "scratchpad" || projects.length === 0) {
      fetchProjects();
    }
  }, [activeTab, projects.length, fetchProjects]);

  useWorkspaceHotkeys({
    onNewPrompt: () => handleCreatePrompt(),
    onNewDraft: () => handleCreateDraft(),
    focusSearch: () => searchInputRef.current?.focus(),
    toggleSnippets: () => toggleSnippetPanel()
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "escape" && isSnippetPanelOpen) {
        toggleSnippetPanel(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSnippetPanelOpen, toggleSnippetPanel]);

  useEffect(() => {
    // 切換專案時退出草稿模式
    setSelectedInboxId(null);
  }, [selectedProjectId]);

  const handleFrontmatterChange = (partial: Partial<PromptFrontmatter>) => {
    if (!promptFrontmatter) return;
    const next = { ...promptFrontmatter, ...partial } as PromptFrontmatter;
    setPromptFrontmatter(next);
    setEditorDirty(true);
  };

  const scheduleUndo = (message: string, commit: () => Promise<void>, onUndo?: () => void) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoMessage(message);
    setUndoOpen(true);
    undoRef.current = () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      onUndo?.();
    };
    undoTimerRef.current = setTimeout(async () => {
      undoTimerRef.current = null;
      setUndoOpen(false);
      await commit();
    }, 5000);
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!promptId) return;
    const backup = {
      frontmatter: promptFrontmatter,
      body: promptBody,
      hash: promptHash,
      damaged: promptDamaged,
      parseErrorCode: promptParseErrorCode,
      parseErrorMessage: promptParseErrorMessage,
      selectedId: promptId
    };
    setSelectedPromptId(null);
    setPromptFrontmatter(null);
    setPromptBody("");
    setPromptHash(null);
    setPromptDamaged(false);
    setPromptParseErrorCode(null);
    setPromptParseErrorMessage(null);
    const commit = async () => {
      try {
        const res = await fetch(`/api/prompts/${promptId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("刪除提示詞失敗");
        setPromptRefreshKey((k) => k + 1);
        setProjectRefreshKey((k) => k + 1);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "刪除提示詞失敗");
      }
    };
    const undo = () => {
      setPromptFrontmatter(backup.frontmatter);
      setPromptBody(backup.body);
      setPromptHash(backup.hash);
      setPromptDamaged(backup.damaged);
      setPromptParseErrorCode(backup.parseErrorCode);
      setPromptParseErrorMessage(backup.parseErrorMessage);
      setSelectedPromptId(backup.selectedId);
    };
    scheduleUndo("已排程刪除提示詞，5 秒內可撤銷", commit, undo);
    return Promise.resolve();
  };

  const handleArchiveSuccess = (result: { promptId?: string; projectName?: string }) => {
    setSelectedInboxId(null);
    setInboxRefreshKey((k) => k + 1);
    setProjectRefreshKey((k) => k + 1);
    setPromptRefreshKey((k) => k + 1);
    if (result.projectName) {
      setSelectedProjectId(result.projectName);
    }
    if (result.promptId) {
      setSelectedPromptId(result.promptId);
    }
  };

  const handleDraftDeleted = () => {
    setSelectedInboxId(null);
    setInboxRefreshKey((k) => k + 1);
  };

  const selectedProject = projects.find((p) => p.name === selectedProjectId) ?? null;

  const createPrompt = async (options?: { title?: string; skipPrompt?: boolean }) => {
    const projectName = selectedProjectId ?? projects[0]?.name;
    if (!projectName) {
      window.alert("請先建立並選擇專案");
      return;
    }

    let resolvedTitle = options?.title?.trim();
    if (!resolvedTitle) {
      if (options?.skipPrompt) {
        resolvedTitle = `快速新增 ${new Date().toLocaleTimeString()}`;
      } else {
        const input = window.prompt("輸入提示詞標題", "新提示詞");
        resolvedTitle = (input ?? "").trim();
      }
    }
    if (!resolvedTitle) return;

    try {
      setCreatingPrompt(true);
      const now = new Date().toISOString();
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontmatter: {
            title: resolvedTitle,
            project: projectName,
            type: "其他" as PromptType,
            status: "使用中" as PromptStatus,
            model: "gpt-4o-mini",
            tags: [],
            updatedAt: now,
            createdAt: now
          },
          body: ""
        })
      });
      if (!res.ok) throw new Error("建立提示詞失敗，請確認已設定根路徑");
      const data = await res.json();
      setSelectedPromptId(data.id);
      setSelectedInboxId(null);
      setPromptFrontmatter(data.frontmatter);
      setPromptBody(data.body ?? "");
      setPromptHash(data.hash ?? null);
      setPromptDamaged(!!data.damaged);
      setPromptParseErrorCode(data.errorCode ?? null);
      setPromptParseErrorMessage(data.errorMessage ?? null);
      setPromptRefreshKey((k) => k + 1);
      setProjectRefreshKey((k) => k + 1);
      setListCollapsed(false);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "建立提示詞失敗");
    } finally {
      setCreatingPrompt(false);
    }
  };

  const handleCreatePrompt = async () => {
    await createPrompt();
  };

  const handleQuickAddPrompt = async () => {
    await createPrompt({ skipPrompt: true });
    setShowChangeLog(false);
  };

  const handleCreateDraft = async () => {
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "快速草稿", content: "" })
      });
      if (!res.ok) throw new Error("建立草稿失敗");
      const created = await res.json();
      setInboxItems((prev) => {
        const next = prev.filter((item) => item.id !== created.id);
        return [created, ...next];
      });
      setSelectedInboxId(created.id);
      setSelectedPromptId(null);
      setInboxRefreshKey((k) => k + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "建立草稿失敗");
    }
  };

  const handleChangeReportSelect = (item: ChangeReportItem) => {
    setFocusModeState(false);
    setListCollapsed(false);
    if (item.kind === "prompt") {
      if (item.projectId) setSelectedProjectId(item.projectId);
      setSelectedInboxId(null);
      setSelectedPromptId(item.id);
    } else {
      setSelectedPromptId(null);
      setSelectedInboxId(item.id);
    }
    setShowChangeLog(false);
  };

  const startResize = (target: "left" | "middle") => (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const baseLeft = leftWidth;
    const baseMiddle = middleWidth;

    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      if (target === "left") {
        const next = Math.max(220, baseLeft + delta);
        setLeftWidth(next);
      } else {
        const next = Math.max(240, baseMiddle + delta);
        setMiddleWidth(next);
      }
    };

    const onUp = () => {
      setLayout({ leftWidth: leftWidthRef.current, middleWidth: middleWidthRef.current });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="theme-prototype">
      <div className="pm-app">
        <TopBar
          onShowChangeReport={() => setShowChangeLog(true)}
          onCreatePrompt={handleCreatePrompt}
          creating={creatingPrompt}
          onToggleSnippetPanel={() => toggleSnippetPanel()}
          snippetOpen={isSnippetPanelOpen}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setListCollapsed(false);
            if (tab === "prompts") {
              setSelectedInboxId(null);
              setSelectedPromptId(null);
            }
          }}
        />
        <div
          className="fixed left-1/2 z-30 w-[min(960px,calc(100%-64px))] -translate-x-1/2"
          style={{ top: "calc(var(--pm-app-pad-y) + 4rem)" }}
        >
          <RootPathAlert className="w-full drop-shadow" />
        </div>
      {activeTab === "prompts" ? (
        <section
          className="flex-1 min-h-0"
          role="tabpanel"
          id="workspace-tabpanel-prompts"
          aria-labelledby="workspace-tab-prompts"
        >
          <div className="pm-shell h-full min-h-0">
            <div className="pm-panel min-h-0 overflow-hidden">
              {selectedPromptId ? (
                <div className="h-full min-h-0 flex flex-col">
                  <div className="pm-panel-header px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--pm-border)" }}>
                    <div className="flex items-center gap-3">
                      <button className="pm-btn pm-btn-ghost h-8 px-3 text-[11px]" type="button" onClick={() => setSelectedPromptId(null)}>
                        ← 返回列表
                      </button>
                      <div className="text-sm font-semibold" style={{ color: "var(--pm-text)" }}>
                        {promptFrontmatter?.title ?? "Prompt 詳情"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="pm-btn h-8 px-3 text-[11px]" type="button" onClick={() => setPromptRefreshKey((k) => k + 1)}>
                        重新整理
                      </button>
                    </div>
                  </div>
                  <section className="flex-1 min-h-0 overflow-auto p-6" data-testid="editor-panel">
                    <AsyncBoundary loading={promptLoading} error={promptError} onRetry={loadPrompt} label="提示詞內容">
                      <div className="flex h-full gap-3">
                        <div className="flex-1 flex flex-col gap-3">
                          <ProjectReadme project={selectedProject} onSaved={() => setProjectRefreshKey((k) => k + 1)} />
                          {promptFrontmatter && (
                            <FrontmatterAccordion
                              frontmatter={promptFrontmatter}
                              onChange={handleFrontmatterChange}
                              onDelete={() => selectedPromptId && handleDeletePrompt(selectedPromptId)}
                            />
                          )}
                          <PromptHeader
                            title={promptFrontmatter?.title ?? "尚未選擇提示詞"}
                            frontmatter={promptFrontmatter}
                            body={promptBody}
                            onToggleFocus={toggleFocusMode}
                          />
                          <PromptEditor
                            promptId={selectedPromptId}
                            initialFrontmatter={promptFrontmatter}
                            initialBody={promptBody}
                            clientHash={promptHash}
                            initialDamaged={promptDamaged}
                            initialParseErrorCode={promptParseErrorCode}
                            initialParseErrorMessage={promptParseErrorMessage}
                            insertText={pendingInsert}
                            onInserted={() => setPendingInsert(null)}
                            onBodyChange={(body) => setPromptBody(body)}
                            onFrontmatterChange={(fm) => setPromptFrontmatter(fm)}
                            onDamagedChange={(flag) => setPromptDamaged(flag)}
                          />
                        </div>
                      </div>
                    </AsyncBoundary>
                  </section>
                </div>
              ) : (
                <main className="h-full min-h-0" data-testid="prompt-list-panel">
                  <ErrorBoundary label="提示詞列表">
                    <PromptList
                      refreshKey={promptRefreshKey}
                      onDeletePrompt={handleDeletePrompt}
                      onScheduleUndo={scheduleUndo}
                      searchInputRef={searchInputRef}
                      pinned={true}
                      onOpenPrompt={(id) => setSelectedPromptId(id)}
                      onLoaded={(items) => {
                        const kpi = items.reduce(
                          (acc, p) => {
                            acc.total += 1;
                            if (p.status === "使用中") acc.inUse += 1;
                            else if (p.status === "草稿") acc.draft += 1;
                            else if (p.status === "已封存") acc.archived += 1;
                            return acc;
                          },
                          { total: 0, inUse: 0, draft: 0, archived: 0 }
                        );
                        setPromptsKpi(kpi);
                      }}
                    />
                  </ErrorBoundary>
                </main>
              )}
            </div>

            <aside className="space-y-6">
              <div className="pm-panel p-6" style={{ position: "sticky", top: 24 }}>
                {selectedPromptId ? (
                  <>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "var(--pm-muted)" }}>
                      Detail
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--pm-muted)" }}>專案</span>
                        <span className="font-semibold">{selectedProject?.name ?? "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--pm-muted)" }}>標題</span>
                        <span className="font-semibold truncate max-w-[220px]" title={promptFrontmatter?.title ?? ""}>
                          {promptFrontmatter?.title ?? "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--pm-muted)" }}>字數</span>
                        <span className="font-semibold">{(promptBody ?? "").length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--pm-muted)" }}>行數</span>
                        <span className="font-semibold">{(promptBody ?? "").length ? (promptBody ?? "").split(/\r?\n/).length : 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: "var(--pm-muted)" }}>片語</span>
                        <button className="pm-btn h-8 px-3 text-[11px]" onClick={() => toggleSnippetPanel(!isSnippetPanelOpen)}>
                          {isSnippetPanelOpen ? "收合" : "展開"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs uppercase tracking-wide" style={{ color: "var(--pm-muted)" }}>
                      Prompts KPI
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="pm-card">
                        <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
                          全部
                        </div>
                        <div className="text-lg font-semibold" style={{ color: "var(--pm-text)" }}>
                          {promptsKpi.total}
                        </div>
                      </div>
                      <div className="pm-card">
                        <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
                          使用中
                        </div>
                        <div className="text-lg font-semibold" style={{ color: "var(--pm-text)" }}>
                          {promptsKpi.inUse}
                        </div>
                      </div>
                      <div className="pm-card">
                        <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
                          草稿
                        </div>
                        <div className="text-lg font-semibold" style={{ color: "var(--pm-text)" }}>
                          {promptsKpi.draft}
                        </div>
                      </div>
                      <div className="pm-card">
                        <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
                          已封存
                        </div>
                        <div className="text-lg font-semibold" style={{ color: "var(--pm-text)" }}>
                          {promptsKpi.archived}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button className="pm-btn h-8 px-3 text-[11px]" type="button" onClick={() => setPromptRefreshKey((k) => k + 1)}>
                        重新整理
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div
                className="pm-panel overflow-hidden"
                data-testid="snippet-drawer"
                data-open={isSnippetPanelOpen}
                style={{ position: "sticky", top: 24 + 260 }}
              >
                {isSnippetPanelOpen ? (
                  <SnippetPanel onInsert={(snippet: Snippet) => insertSnippet(snippet)} onClose={() => toggleSnippetPanel(false)} />
                ) : (
                  <div className="p-6">
                    <div className="text-sm font-semibold">常用片語</div>
                    <div className="mt-1 text-sm" style={{ color: "var(--pm-muted)" }}>
                      由上方「開啟片語」或側欄「展開」顯示。
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      ) : activeTab === "scratchpad" ? (
        <section
          className="flex flex-1 overflow-hidden"
          role="tabpanel"
          id="workspace-tabpanel-scratchpad"
          aria-labelledby="workspace-tab-scratchpad"
        >
          <Scratchpad projects={projects} onScheduleUndo={scheduleUndo} />
        </section>
      ) : (
        <section
          className="flex flex-1 overflow-hidden"
          role="tabpanel"
          id="workspace-tabpanel-projects"
          aria-labelledby="workspace-tab-projects"
        >
          <TabPlaceholders tab={activeTab} />
        </section>
      )}
      <ChangeReportModal
        open={showChangeLog}
        onClose={() => setShowChangeLog(false)}
        onSelect={handleChangeReportSelect}
        onQuickAdd={handleQuickAddPrompt}
      />
      <SnackbarUndo
        open={undoOpen}
        message={undoMessage}
        onUndo={() => {
          undoRef.current();
          setUndoOpen(false);
        }}
        onTimeout={() => setUndoOpen(false)}
        onClose={() => setUndoOpen(false)}
      />
      </div>
    </div>
  );
}
