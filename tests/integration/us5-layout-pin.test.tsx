import React, { useEffect } from "react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { useWorkspaceHotkeys } from "@/app/(workspace)/hooks/useWorkspaceHotkeys";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

beforeEach(() => {
  vi.useFakeTimers();
});

function HotkeyHarness({
  onPrompt,
  onDraft
}: {
  onPrompt: () => void;
  onDraft: () => void;
}) {
  const layout = useWorkspaceStore((s) => s.layout);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const listCollapsed = useWorkspaceStore((s) => s.listCollapsed);
  const setListCollapsed = useWorkspaceStore((s) => s.setListCollapsed);
  const pinned = useWorkspaceStore((s) => s.pinned);
  const setPinned = useWorkspaceStore((s) => s.setPinned);
  const hydratePreferences = useWorkspaceStore((s) => s.hydratePreferences);

  useWorkspaceHotkeys({
    onNewPrompt: onPrompt,
    onNewDraft: onDraft,
    focusSearch: () => {},
    toggleSnippets: () => {}
  });

  useEffect(() => {
    hydratePreferences();
  }, [hydratePreferences]);

  return (
    <div>
      <div data-testid="pinned">{String(pinned)}</div>
      <div data-testid="collapsed">{String(listCollapsed)}</div>
      <div data-testid="left-width">{layout.leftWidth}</div>
      <button data-testid="drag-left" onClick={() => setLayout({ leftWidth: 420, middleWidth: 610 })}>
        resize
      </button>
      <button data-testid="select-prompt" onClick={() => setListCollapsed(true)}>
        select prompt
      </button>
      <button data-testid="toggle-pin" onClick={() => setPinned(!pinned)}>
        toggle pin
      </button>
    </div>
  );
}

describe("US5 layout and pin", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("persists panel widths after resize", async () => {
    render(<HotkeyHarness onPrompt={() => {}} onDraft={() => {}} />);
    fireEvent.click(screen.getByTestId("drag-left"));
    await vi.advanceTimersByTimeAsync(400);
    const stored = JSON.parse(localStorage.getItem("pm-settings") || "{}");
    expect(stored.layout.leftWidth).toBe(420);
    expect(stored.layout.middleWidth).toBe(610);
  });

  it("pin off collapses list after select and Alt+L reopens", () => {
    render(<HotkeyHarness onPrompt={() => {}} onDraft={() => {}} />);
    fireEvent.click(screen.getByTestId("toggle-pin"));
    expect(screen.getByTestId("pinned")).toHaveTextContent("false");

    fireEvent.click(screen.getByTestId("select-prompt"));
    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");

    fireEvent.keyDown(window, { key: "l", altKey: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
  });

  it("Alt+Shift+N triggers draft creation shortcut", () => {
    const onDraft = vi.fn();
    render(<HotkeyHarness onPrompt={() => {}} onDraft={onDraft} />);
    fireEvent.keyDown(window, { key: "N", altKey: true, shiftKey: true });
    expect(onDraft).toHaveBeenCalled();
  });
});
