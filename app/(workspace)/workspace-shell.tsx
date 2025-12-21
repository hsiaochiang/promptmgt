"use client";

import TopBar from "./components/top-bar";
import ProjectList from "./components/project-list";
import InboxList from "./components/inbox-list";
import PromptList from "./components/prompt-list";
import PromptHeader from "./components/prompt-header";
import PromptEditor from "./components/prompt-editor";
import ChangeReportModal, { ChangeReportItem } from "./components/change-report-modal";
import SnippetPanel from "./components/snippet-panel";
import DraftEditor from "./components/draft-editor";
import { AsyncBoundary, ErrorBoundary } from "./components/error-boundary";
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);
  const [promptRefreshKey, setPromptRefreshKey] = useState(0);

  const [promptFrontmatter, setPromptFrontmatter] = useState<PromptFrontmatter | null>(null);
  const [promptBody, setPromptBody] = useState<string>("");
  const [promptHash, setPromptHash] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [pendingInsert, setPendingInsert] = useState<string | null>(null);
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

  const loadPrompt = useCallback(async () => {
    if (!selectedPromptId) {
      setPromptFrontmatter(null);
      setPromptBody("");
      setPromptHash(null);
      setPromptLoading(false);
      setPromptError(null);
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

  const handleDeletePrompt = async (promptId: string) => {
    if (!promptId) return;
    try {
      const res = await fetch(`/api/prompts/${promptId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("刪除提示詞失敗");
      setSelectedPromptId(null);
      setPromptFrontmatter(null);
      setPromptBody("");
      setPromptHash(null);
      setPromptRefreshKey((k) => k + 1);
      setProjectRefreshKey((k) => k + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "刪除提示詞失敗");
    }
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
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <TopBar
        onShowChangeReport={() => setShowChangeLog(true)}
        onCreatePrompt={handleCreatePrompt}
        creating={creatingPrompt}
        onToggleSnippetPanel={() => toggleSnippetPanel()}
        snippetOpen={isSnippetPanelOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex-shrink-0 border-r border-slate-200 bg-white flex flex-col transition-all duration-200"
          style={{ width: leftWidth }}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold text-xs tracking-wide text-slate-600">專案與收件匣</div>
            <div className="text-[10px] rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 border border-amber-200">
              收件匣 {inboxCount}
            </div>
          </div>
          <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
            <ProjectList
              refreshKey={projectRefreshKey}
              onProjectsChange={(list) => {
                setProjects(list);
                if (!selectedProjectId && list.length > 0) {
                  setSelectedProjectId(list[0].name);
                }
              }}
            />
            <div className="pt-2 border-t border-slate-200 mt-2">
              <InboxList
                selectedId={selectedInboxId}
                onSelect={(id) => {
                  setSelectedInboxId(id);
                  setSelectedPromptId(null);
                }}
                onLoaded={(list) => {
                  setInboxItems(list);
                  if (!selectedInboxId && list.length > 0) {
                    setSelectedInboxId(list[0].id);
                    setSelectedPromptId(null);
                  }
                }}
                refreshKey={inboxRefreshKey}
              />
            </div>
          </div>
        </aside>
        <div className="w-[6px] cursor-col-resize bg-slate-200/70" onMouseDown={startResize("left")} role="separator" />
        <main
          className={`flex flex-col border-r border-slate-200 transition-all duration-200 ${focusMode ? "hidden" : ""} ${
            listCollapsed ? "hidden" : ""
          }`}
          style={{ width: middleWidth }}
          data-testid="prompt-list-panel"
        >
          <div className="h-16 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="text-xs text-slate-500">提示詞列表</div>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button className="px-2 py-1 rounded-full bg-slate-900 text-white">進行中</button>
              <button className="px-2 py-1 rounded-full border border-slate-300 bg-white">
                全部
              </button>
            </div>
          </div>
          <div className="px-4 pt-4">
            <RootPathAlert />
          </div>
          <ErrorBoundary label="提示詞列表">
            <PromptList
              refreshKey={promptRefreshKey}
              onDeletePrompt={handleDeletePrompt}
              onSelectedWhileUnpinned={() => setListCollapsed(true)}
              searchInputRef={searchInputRef}
              pinned={pinned}
              onTogglePinned={() => setPinned(!pinned)}
            />
          </ErrorBoundary>
        </main>
        {listCollapsed && !focusMode && (
          <button
            className="absolute left-2 top-16 z-30 px-3 py-1 rounded-full bg-white shadow border border-slate-200 text-[11px]"
            onClick={() => setListCollapsed(false)}
            data-testid="list-recall"
          >
            顯示列表 (Alt+L)
          </button>
        )}
        <div className="w-[6px] cursor-col-resize bg-slate-200/70" onMouseDown={startResize("middle")} role="separator" />
        <section
          className={`relative flex flex-col p-4 bg-slate-50 transition-all ${focusMode ? "flex-[1_1_100%]" : "flex-[1.8]"}`}
          data-testid="editor-panel"
        >
          <div className="flex flex-col gap-3 h-full">
            {selectedInboxId ? (
              <DraftEditor
                draft={inboxItems.find((i) => i.id === selectedInboxId) ?? null}
                projects={projects}
                onArchived={handleArchiveSuccess}
                onDeleted={handleDraftDeleted}
              />
            ) : (
              <AsyncBoundary
                loading={promptLoading}
                error={promptError}
                onRetry={loadPrompt}
                label="提示詞內容"
              >
                <div className={`flex h-full gap-3 relative ${isSnippetPanelOpen ? "md:pr-[320px]" : ""}`}>
                  <div className="flex-1 flex flex-col gap-3">
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
                      insertText={pendingInsert}
                      onInserted={() => setPendingInsert(null)}
                      onBodyChange={(body) => setPromptBody(body)}
                      onFrontmatterChange={(fm) => setPromptFrontmatter(fm)}
                    />
                  </div>
                  <div
                    className={`fixed md:static top-14 md:top-0 right-0 md:right-auto bottom-0 md:bottom-auto z-30 md:z-0 w-[320px] md:w-72 transition-transform duration-200 ${isSnippetPanelOpen ? "translate-x-0" : "translate-x-full"}`}
                    data-testid="snippet-drawer"
                    data-open={isSnippetPanelOpen}
                  >
                    <SnippetPanel onInsert={(snippet: Snippet) => insertSnippet(snippet)} onClose={() => toggleSnippetPanel(false)} />
                  </div>
                  {isSnippetPanelOpen && (
                    <div
                      className="fixed inset-0 top-14 bg-black/10 md:hidden"
                      onClick={() => toggleSnippetPanel(false)}
                      data-testid="snippet-overlay"
                    />
                  )}
                </div>
              </AsyncBoundary>
            )}
          </div>
        </section>
      </div>
      <ChangeReportModal
        open={showChangeLog}
        onClose={() => setShowChangeLog(false)}
        onSelect={handleChangeReportSelect}
        onQuickAdd={handleQuickAddPrompt}
      />
    </div>
  );
}
