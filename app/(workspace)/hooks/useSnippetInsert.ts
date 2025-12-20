"use client";

import { useState } from "react";
import type { Snippet } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export function useSnippetInsert(onInsert: (content: string) => void) {
  const [error, setError] = useState<string | null>(null);
  const setLoading = useWorkspaceStore((s) => s.setLoading);

  const handleInsert = async (snippet: Snippet): Promise<Snippet> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/snippets/${snippet.id}/usage`, { method: "POST" });
      if (!res.ok) {
        throw new Error("片語使用次數更新失敗");
      }
      const updated = (await res.json()) as Snippet;
      onInsert(updated.content);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "插入失敗");
      throw err instanceof Error ? err : new Error("插入失敗");
    } finally {
      setLoading(false);
    }
  };

  return { insertSnippet: handleInsert, error };
}
