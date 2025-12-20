"use client";

import { useState } from "react";
import type { Snippet } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

export function useSnippetInsert(onInsert: (content: string) => void) {
  const [error, setError] = useState<string | null>(null);
  const setLoading = useWorkspaceStore((s) => s.setLoading);

  const handleInsert = async (snippet: Snippet) => {
    setLoading(true);
    setError(null);
    try {
      await fetch(`/api/snippets/${snippet.id}/usage`, { method: "POST" });
      onInsert(snippet.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "插入失敗");
    } finally {
      setLoading(false);
    }
  };

  return { insertSnippet: handleInsert, error };
}
