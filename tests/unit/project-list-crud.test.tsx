import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProjectList from "@/app/(workspace)/components/project-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";
import type { Project } from "@/lib/types/schema";

function makeProject(
  id: string,
  name: string,
  status: Project["status"] = "規劃中",
  promptCount = 0
): Project {
  return { id, name, status, promptCount, updatedAt: "2025-01-01" };
}

describe("ProjectList CRUD UI", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ selectedProjectId: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
    useWorkspaceStore.setState({ selectedProjectId: null });
  });

  it("新增專案後選取新專案並刷新列表", async () => {
    const responses = [
      [makeProject("proj-1", "A", "進行中", 1)],
      makeProject("proj-3", "新專案", "規劃中", 0),
      [makeProject("proj-1", "A", "進行中", 1), makeProject("proj-3", "新專案", "規劃中", 0)]
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
        const payload = responses.shift();
        const status = init?.method === "POST" ? 201 : 200;
        return new Response(JSON.stringify(payload), { status });
      })
    );
    vi.spyOn(window, "prompt").mockReturnValue("新專案");

    render(<ProjectList onScheduleUndo={(_, commit) => commit()} />);

    await screen.findByText("A");
    fireEvent.click(screen.getByText("新增專案"));

    await waitFor(() => expect(useWorkspaceStore.getState().selectedProjectId).toBe("新專案"));
    expect(screen.getByText("新專案")).toBeInTheDocument();
  });

  it("編輯專案保留選取並更新狀態顯示", async () => {
    const responses = [
      [makeProject("proj-1", "A", "規劃中", 2)],
      makeProject("proj-1", "A-renamed", "進行中", 2),
      [makeProject("proj-1", "A-renamed", "進行中", 2)]
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
        const payload = responses.shift();
        const status = init?.method === "PATCH" ? 200 : 200;
        return new Response(JSON.stringify(payload), { status });
      })
    );
    vi.spyOn(window, "prompt").mockImplementationOnce(() => "A-renamed").mockImplementationOnce(() => "進行中");

    useWorkspaceStore.setState({ selectedProjectId: "A" });
    render(<ProjectList onScheduleUndo={(_, commit) => commit()} />);

    await screen.findByText("A");
    fireEvent.click(screen.getByText("編輯"));

    await waitFor(() => expect(screen.getByText(/A-renamed/)).toBeInTheDocument());
    expect(useWorkspaceStore.getState().selectedProjectId).toBe("A-renamed");
    expect(screen.getAllByText("進行中").length).toBeGreaterThan(0);
  });

  it("刪除選取專案後清空選取並刷新列表", async () => {
    const responses = [
      [makeProject("proj-1", "A", "進行中", 1), makeProject("proj-2", "B", "進行中", 0)],
      { ok: true },
      [makeProject("proj-2", "B", "進行中", 0)]
    ];

    const fetchMock = vi.fn(async (_input: RequestInfo, init?: RequestInit) => {
      const payload = responses.shift();
      const status = init?.method === "DELETE" ? 200 : 200;
      return new Response(JSON.stringify(payload), { status });
    });
    vi.stubGlobal("fetch", fetchMock);
    useWorkspaceStore.setState({ selectedProjectId: "A" });
    render(<ProjectList onScheduleUndo={(_, commit) => commit()} />);

    await screen.findByText("A");
    fireEvent.click(screen.getAllByText("刪除")[0]);
    fireEvent.click(await screen.findByTestId("confirm-accept"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(useWorkspaceStore.getState().selectedProjectId).toBeNull());
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("0 篇")).toBeInTheDocument();
  });
});
