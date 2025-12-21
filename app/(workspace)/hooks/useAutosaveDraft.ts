"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Options {
  draftId: string | null;
  title: string;
  content: string;
  hint: string;
  delay?: number;
}

export function useAutosaveDraft({ draftId, title, content, hint, delay = 2000 }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const setLastSavedAt = useWorkspaceStore((s) => s.setLastSavedAt);

  useEffect(() => {
    if (!draftId) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const expectedUpdatedAt = useWorkspaceStore.getState().lastSavedAt ?? undefined;
        const res = await fetch(`/api/inbox/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, hint, expectedUpdatedAt })
        });
        if (res.status === 409) {
          // 外部有更新，保持 dirty 由 UI 引導使用者處理
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        setEditorDirty(false);
        setLastSavedAt(data.updatedAt ?? new Date().toISOString());
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draftId, title, content, hint, delay, setEditorDirty, setLastSavedAt]);

  return { isSaving };
}
