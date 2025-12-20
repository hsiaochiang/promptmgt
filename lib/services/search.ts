import type { PromptListItem } from "../types/schema";

export interface SearchResult extends PromptListItem {
  snippet: string;
}

export function searchPrompts(
  prompts: PromptListItem[],
  query: string,
  limit = 1000
): SearchResult[] {
  if (!query.trim()) return [];
  const lowered = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const item of prompts) {
    const haystack =
      item.title.toLowerCase() + " " + item.tags.join(" ").toLowerCase() + " " + item.model;
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

function createSnippet(text: string, query: string, radius = 30) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return text.slice(start, end);
}
