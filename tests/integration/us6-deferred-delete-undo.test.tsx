import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProjectList from "@/app/(workspace)/components/project-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

describe("US6 - Deferred delete + Undo 5 秒", () => {
  const fetchMock = vi.fn();
  const initialState = useWorkspaceStore.getState();

  beforeEach(() => {
    useWorkspaceStore.setState(initialState);
    fetchMock.mockReset();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialState);
    vi.restoreAllMocks();
  });

  const projectPayload = [{ id: "p1", name: "P1", status: "進行中", promptCount: 0, docPath: "/tmp", createdAt: "2024", updatedAt: "2024" }];

  it("5 秒後才實際刪除，未 Undo 會呼叫 DELETE", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(projectPayload), { status: 200 })) // initial load
      .mockResolvedValueOnce(new Response(null, { status: 200 })) // delete
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })); // refresh

    let scheduledCommit: (() => Promise<void>) | null = null;
    const scheduleUndo = (message: string, commit: () => Promise<void>) => {
      expect(message).toMatch(/5 秒內可撤銷/);
      scheduledCommit = commit;
    };

    render(<ProjectList onScheduleUndo={scheduleUndo} />);

    const deleteBtn = await screen.findByText("刪除");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("confirm-accept"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(scheduledCommit).toBeTruthy();
    await scheduledCommit?.();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][1]?.method).toBe("DELETE");
  }, 15000);

  it("在 5 秒內 Undo 不會呼叫 DELETE", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(projectPayload), { status: 200 })) // initial
      .mockResolvedValue(new Response(null, { status: 200 }));

    let undoFn: (() => void) | null = null;
    let commitFn: (() => Promise<void>) | null = null;
    const scheduleUndo = (_: string, commit: () => Promise<void>, onUndo?: () => void) => {
      commitFn = commit;
      undoFn = onUndo ?? null;
    };

    render(<ProjectList onScheduleUndo={scheduleUndo} />);

    const deleteBtn = await screen.findByText("刪除");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("confirm-accept"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    undoFn?.();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(commitFn).toBeTruthy();
  }, 15000);
});
