import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import PromptList from "@/app/(workspace)/components/prompt-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

const prompts = [
  {
    id: "p1",
    title: "Alpha",
    project: "proj-1",
    projectId: "proj-1",
    type: "類型A",
    status: "使用中",
    model: "gpt-4",
    tags: ["t1"],
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: "p2",
    title: "Beta",
    project: "proj-1",
    projectId: "proj-1",
    type: "類型A",
    status: "使用中",
    model: "gpt-4",
    tags: ["t2"],
    updatedAt: "2025-01-02T00:00:00.000Z"
  }
];

describe("prompt-batch-actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useWorkspaceStore.getState().setSelectedProjectId("proj-1");
    global.fetch = vi.fn()
      // 第一次載入列表
      .mockResolvedValueOnce({ ok: true, json: async () => prompts })
      // 刪除 p1
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      // 刪除 p2
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
      // 重新整理列表
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("supports multi-select and shows confirmation for destructive actions", async () => {
    render(
      <PromptList pinned onTogglePinned={() => {}} />
    );

    await screen.findByText("Alpha");

    fireEvent.click(screen.getByTestId("select-p1"));
    fireEvent.click(screen.getByTestId("select-p2"));

    const batchDelete = await screen.findByTestId("batch-delete");
    fireEvent.click(batchDelete);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith("/api/prompts/p1", expect.objectContaining({ method: "DELETE" }));
      expect(global.fetch).toHaveBeenCalledWith("/api/prompts/p2", expect.objectContaining({ method: "DELETE" }));
    });
  });
});
