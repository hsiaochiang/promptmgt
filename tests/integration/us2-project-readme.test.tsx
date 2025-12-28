import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProjectReadme from "@/app/(workspace)/components/project-readme";
import type { Project } from "@/lib/types/schema";

describe("US2 - Project Detail README", () => {
  const project: Project = {
    id: "proj-1",
    name: "Demo Project",
    status: "進行中",
    promptCount: 2,
    docPath: "README.md",
    createdAt: "2024-01-01T00:00:00+08:00",
    updatedAt: "2024-01-02T00:00:00+08:00"
  };

  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("載入並顯示 README，儲存後更新時間", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ content: "# Demo", hash: "h1", mtimeMs: 1000 }), { status: 200 })
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ hash: "h2", mtimeMs: 2000, updatedAt: "2024-01-03T12:00:00+08:00" }), { status: 200 })
    );

    render(<ProjectReadme project={project} onSaved={vi.fn()} />);

    expect(await screen.findByDisplayValue("# Demo")).toBeInTheDocument();

    fireEvent.click(screen.getByText("儲存"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/更新：/)).toBeInTheDocument();
    });
  });

  it("顯示 409 衝突細節並允許接受伺服端版本", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ content: "# Demo", hash: "h1", mtimeMs: 1000 }), { status: 200 })
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Conflict detected", details: { currentHash: "server", currentMtime: 3000 } }), {
        status: 409
      })
    );

    render(<ProjectReadme project={project} />);

    expect(await screen.findByDisplayValue("# Demo")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("# Demo"), { target: { value: "# Updated" } });
    fireEvent.click(screen.getByText("儲存"));

    await screen.findByText(/Conflict/);
    expect(screen.getByText(/hash：server/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("重新載入外部版本"));
  });
});
