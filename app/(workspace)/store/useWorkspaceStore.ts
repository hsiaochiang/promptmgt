import { create } from "zustand";

export type FilterStatus = "進行中" | "全部";

interface WorkspaceState {
  selectedProjectId: string | null;
  selectedPromptId: string | null;
  searchQuery: string;
  filterStatus: FilterStatus;
  editorContent: string;
  editorDirty: boolean;
  lastSavedAt: string | null;
  inboxCount: number;
  isSnippetPanelOpen: boolean;
  isLoading: boolean;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedPromptId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setEditorContent: (content: string) => void;
  setEditorDirty: (dirty: boolean) => void;
  setLastSavedAt: (timestamp: string | null) => void;
  setInboxCount: (count: number) => void;
  toggleSnippetPanel: (open?: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedProjectId: null,
  selectedPromptId: null,
  searchQuery: "",
  filterStatus: "全部",
  editorContent: "",
  editorDirty: false,
  lastSavedAt: null,
  inboxCount: 0,
  isSnippetPanelOpen: true,
  isLoading: false,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setEditorContent: (content) => set({ editorContent: content, editorDirty: true }),
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
  setInboxCount: (count) => set({ inboxCount: count }),
  toggleSnippetPanel: (open) =>
    set((state) => ({ isSnippetPanelOpen: open ?? !state.isSnippetPanelOpen })),
  setLoading: (loading) => set({ isLoading: loading })
}));
