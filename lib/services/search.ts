import type { PromptListItem } from "../types/schema";

export interface SearchResult extends PromptListItem {
  snippet: string;
}

interface SearchFilter {
  projectId?: string;
  status?: string;
}

export function searchPrompts(
  prompts: PromptListItem[],
  query: string,
  limit = 1000,
  filter: SearchFilter = {}
): SearchResult[] {
  if (!query.trim()) return [];
  const lowered = query.toLowerCase();
  const results: SearchResult[] = [];

  const stringifyTag = (tag: unknown) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag === "object") {
      const payload = tag as Record<string, unknown>;
      const code = typeof payload.code === "string" ? payload.code : "";
      const name = typeof payload.name === "string" ? payload.name : "";
      return `${code} ${name}`.trim();
    }
    return "";
  };

  for (const item of prompts) {
    if (filter.projectId && item.projectId !== filter.projectId && item.project !== filter.projectId) {
      continue;
    }
    if (filter.status && item.status !== filter.status) {
      continue;
    }

    const tagsText = (item.tags ?? [])
      .map((t) => stringifyTag(t).toLowerCase())
      .filter(Boolean)
      .join(" ");
    const haystack = item.title.toLowerCase() + " " + tagsText + " " + (item.model ?? "");
    if (haystack.includes(lowered)) {
      results.push({
        ...item,
        snippet: createSnippet(item.title, query)
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}

export function searchPromptsWithTruncation(
  prompts: PromptListItem[],
  query: string,
  limit = 1000,
  filter: SearchFilter = {}
): { results: SearchResult[]; truncated: boolean } {
  // 嘗試抓取 limit+1 筆以判斷是否截斷，再回傳前 limit 筆
  const hardLimit = Math.min(limit, 1000);
  const buffer = searchPrompts(prompts, query, hardLimit + 1, filter);
  const truncated = buffer.length > hardLimit;
  return {
    results: buffer.slice(0, hardLimit),
    truncated
  };
}

function createSnippet(text: string, query: string, radius = 30) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return text.slice(start, end);
}
