"use client";

import { useEffect, useRef, useState } from "react";
import type { PromptFrontmatter } from "@/lib/types/schema";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Options {
  promptId: string | null;
  frontmatter: PromptFrontmatter | null;
  body: string;
  clientHash: string | null;
  delay?: number;
  onSaved?: (hash: string) => void;
  onConflict?: (serverHash: string) => void;
}

export function useAutosavePrompt({
  promptId,
  frontmatter,
  body,
  clientHash,
  delay = 2000,
  onSaved,
  onConflict
}: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const setLastSavedAt = useWorkspaceStore((s) => s.setLastSavedAt);

  useEffect(() => {
    if (!promptId || !frontmatter) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/prompts/${promptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontmatter, body, clientHash })
        });
        if (res.status === 409) {
          const data = await res.json();
          const serverHash = data?.currentHash ?? null;
          setError("發現外部變更，請選擇載入或覆寫。");
          if (serverHash && onConflict) {
            onConflict(serverHash);
          }
          return;
        }
        const data = await res.json();
        if (data.hash && onSaved) {
          onSaved(data.hash);
        }
        setEditorDirty(false);
        setLastSavedAt(data.updatedAt ?? new Date().toISOString());
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [promptId, frontmatter, body, clientHash, delay, onSaved, onConflict, setEditorDirty, setLastSavedAt]);

  return { isSaving, error };
}
