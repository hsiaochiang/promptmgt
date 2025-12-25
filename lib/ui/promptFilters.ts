export type PromptLike = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags?: string[];
  status?: string;
  archived?: boolean;
};

export type PromptFilter = {
  query?: string;
  status?: string;
  projectId?: string;
  includeArchived?: boolean;
};

export function applyPromptFilters<T extends PromptLike>(prompts: T[], filter: PromptFilter): T[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  const status = filter.status ?? "all";
  const projectId = filter.projectId ?? "all";
  const includeArchived = filter.includeArchived ?? false;

  return prompts.filter((p) => {
    if (!includeArchived && p.archived) return false;
    if (status !== "all" && p.status && p.status !== status) return false;
    if (projectId !== "all" && p.projectId !== projectId) return false;
    if (!q) return true;
    const blob = `${p.title} ${p.body} ${(p.tags ?? []).join(" ")}`.toLowerCase();
    return blob.includes(q);
  });
}
