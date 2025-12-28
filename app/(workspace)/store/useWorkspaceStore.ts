import { create } from "zustand";
import { z } from "zod";

export type FilterStatus = "全部" | "使用中" | "草稿" | "已封存";
export type WorkspaceTab = "projects" | "prompts" | "scratchpad";

const STORAGE_KEY = "pm-settings";
const PREFERENCES_VERSION = 1;

const PreferencesSchema = z
  .object({
    version: z.number().default(PREFERENCES_VERSION),
    pinned: z.boolean().default(true),
    layout: z
      .object({
        leftWidth: z.number().min(120).max(960).default(320),
        middleWidth: z.number().min(200).max(960).default(520)
      })
      .partial()
      .default({}),
    fontScale: z.number().min(-4).max(8).default(2)
  })
  .partial()
  .transform((val) => ({
    version: PREFERENCES_VERSION,
    pinned: val.pinned ?? true,
    layout: val.layout ?? { leftWidth: 320, middleWidth: 520 },
    fontScale: val.fontScale ?? 2
  }));

type Preferences = z.infer<typeof PreferencesSchema>;

const defaultPreferences: Preferences = {
  version: PREFERENCES_VERSION,
  pinned: true,
  layout: { leftWidth: 320, middleWidth: 520 },
  fontScale: 2
};

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

function readPreferences(): Preferences {
  if (!canUseStorage()) return defaultPreferences;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultPreferences;
  try {
    const parsed = JSON.parse(raw);
    const result = PreferencesSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(STORAGE_KEY);
      return defaultPreferences;
    }
    return result.data;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultPreferences;
  }
}

let persistTimer: number | null = null;

function queuePersist(state: Preferences) {
  if (!canUseStorage()) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const payload: Preferences = {
      version: PREFERENCES_VERSION,
      pinned: state.pinned,
      layout: state.layout,
      fontScale: state.fontScale
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, 300);
}

interface WorkspaceState {
  selectedProjectId: string | null;
  selectedPromptId: string | null;
  activeTab: WorkspaceTab;
  searchQuery: string;
  filterStatus: FilterStatus;
  editorContent: string;
  editorDirty: boolean;
  lastSavedAt: string | null;
  inboxCount: number;
  isSnippetPanelOpen: boolean;
  isLoading: boolean;
  focusMode: boolean;
  pinned: boolean;
  listCollapsed: boolean;
  layout: { leftWidth?: number; middleWidth?: number };
  fontScale: number;
  scratchpadContent: string;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedPromptId: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setEditorContent: (content: string) => void;
  setEditorDirty: (dirty: boolean) => void;
  setLastSavedAt: (timestamp: string | null) => void;
  setInboxCount: (count: number) => void;
  toggleSnippetPanel: (open?: boolean) => void;
  setLoading: (loading: boolean) => void;
  hydratePreferences: () => void;
  setPinned: (value: boolean) => void;
  setListCollapsed: (collapsed: boolean) => void;
  toggleListCollapsed: () => void;
  setLayout: (layout: { leftWidth?: number; middleWidth?: number }) => void;
  setFontScale: (fontScale: number) => void;
  setFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
  setScratchpadContent: (content: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  selectedProjectId: null,
  selectedPromptId: null,
  activeTab: "prompts",
  searchQuery: "",
  filterStatus: "全部",
  editorContent: "",
  editorDirty: false,
  lastSavedAt: null,
  inboxCount: 0,
  isSnippetPanelOpen: false,
  isLoading: false,
  focusMode: false,
  pinned: defaultPreferences.pinned,
  listCollapsed: false,
  layout: defaultPreferences.layout,
  fontScale: defaultPreferences.fontScale,
  scratchpadContent: "",
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setEditorContent: (content) => set({ editorContent: content, editorDirty: true }),
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
  setInboxCount: (count) => set({ inboxCount: count }),
  toggleSnippetPanel: (open) =>
    set((state) => ({ isSnippetPanelOpen: open ?? !state.isSnippetPanelOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
  hydratePreferences: () => {
    const prefs = readPreferences();
    set({ pinned: prefs.pinned, layout: prefs.layout, fontScale: prefs.fontScale });
  },
  setPinned: (value) => {
    set((state) => {
      const next: Preferences = {
        version: PREFERENCES_VERSION,
        pinned: value,
        layout: state.layout,
        fontScale: state.fontScale
      };
      queuePersist(next);
      return { pinned: value, listCollapsed: value ? false : state.listCollapsed };
    });
  },
  setListCollapsed: (collapsed) => set({ listCollapsed: collapsed }),
  toggleListCollapsed: () => set((state) => ({ listCollapsed: !state.listCollapsed })),
  setLayout: (layout) => {
    const sanitized = {
      leftWidth: layout.leftWidth ?? defaultPreferences.layout.leftWidth,
      middleWidth: layout.middleWidth ?? defaultPreferences.layout.middleWidth
    };
    set((state) => {
      const next: Preferences = {
        version: PREFERENCES_VERSION,
        pinned: state.pinned,
        layout: sanitized,
        fontScale: state.fontScale
      };
      queuePersist(next);
      return { layout: sanitized };
    });
  },
  setFontScale: (fontScale) => {
    const safeFont = Math.min(Math.max(fontScale, -4), 8);
    set((state) => {
      const next: Preferences = {
        version: PREFERENCES_VERSION,
        pinned: state.pinned,
        layout: state.layout,
        fontScale: safeFont
      };
      queuePersist(next);
      return { fontScale: safeFont };
    });
  },
  setFocusMode: (focus) => set({ focusMode: focus }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  setScratchpadContent: (content) => set({ scratchpadContent: content })
}));
