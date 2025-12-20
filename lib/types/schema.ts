export type ProjectStatus = "進行中" | "規劃中" | "已結案";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  promptCount: number;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export interface InboxItem {
  id: string;
  title: string;
  content: string;
  hint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  name: string;
  category: string;
  content: string;
  usage: number;
  lastUsedAt?: string;
}

export interface Settings {
  rootPath: string | null;
  telemetryEnabled: boolean;
  updateCheckEnabled: boolean;
}

export type PromptStatus = "使用中" | "草稿" | "已封存";
export type PromptType = "簡報生成" | "結構設計" | "RAG 調教" | "其他";

export interface PromptFrontmatter {
  title: string;
  project: string;
  type: PromptType;
  status: PromptStatus;
  model: string;
  tags: string[];
  updatedAt: string;
  notes?: string;
}

export interface PromptListItem extends PromptFrontmatter {
  id: string;
  projectId: string;
}

export interface DatabaseSchema {
  projects: Project[];
  inbox: InboxItem[];
  snippets: Snippet[];
  settings: Settings;
}
