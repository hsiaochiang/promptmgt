"use client";

import { useEffect } from "react";
import { mapShortcut } from "../utils/shortcuts";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Options {
  onNewPrompt: () => void;
  onNewDraft: () => void;
  focusSearch: () => void;
  toggleSnippets: () => void;
}

export function useWorkspaceHotkeys({ onNewPrompt, onNewDraft, focusSearch, toggleSnippets }: Options) {
  const toggleListCollapsed = useWorkspaceStore((s) => s.toggleListCollapsed);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  const setPinned = useWorkspaceStore((s) => s.setPinned);
  const pinned = useWorkspaceStore((s) => s.pinned);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const action = mapShortcut(event);
      if (!action) return;
      event.preventDefault();
      switch (action) {
        case "toggle-list":
          toggleListCollapsed();
          break;
        case "toggle-pin":
          setPinned(!pinned);
          break;
        case "new-prompt":
          onNewPrompt();
          break;
        case "new-draft":
          onNewDraft();
          break;
        case "focus-search":
          focusSearch();
          break;
        case "toggle-snippets":
          toggleSnippets();
          break;
        case "focus-mode":
          toggleFocusMode();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusSearch, onNewDraft, onNewPrompt, pinned, setPinned, toggleFocusMode, toggleListCollapsed, toggleSnippets]);
}
