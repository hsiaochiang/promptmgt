import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Scratchpad from "@/app/(workspace)/components/scratchpad";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

describe("US5 - Scratchpad", () => {
  const fetchMock = vi.fn();
  const writeText = vi.fn();
  const projects = [
    { id: "p1", name: "P1", status: "進行中", promptCount: 0, docPath: "/tmp", createdAt: "2024", updatedAt: "2024" }
  ];
  const initialState = useWorkspaceStore.getState();

  beforeEach(() => {
    useWorkspaceStore.setState(initialState);
    fetchMock.mockReset();
    writeText.mockReset();
    global.fetch = fetchMock as any;
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialState);
    vi.restoreAllMocks();
  });

  it("編輯/複製/另存為提示詞並更新 KPI", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "new-prompt-id", hash: "h1", mtimeMs: 1, frontmatter: { project: "P1" } }), {
        status: 201
      })
    );

    render(<Scratchpad projects={projects as any} />);

    const textarea = screen.getByTestId("scratchpad-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "新的內容\n第二行" } });
    expect(useWorkspaceStore.getState().scratchpadContent).toBe("新的內容\n第二行");
    expect(screen.getByTestId("scratchpad-kpi-lines")).toHaveTextContent("2");

    fireEvent.click(screen.getByTestId("scratchpad-copy"));
    expect(writeText).toHaveBeenCalledWith("新的內容\n第二行");

    fireEvent.click(screen.getByTestId("scratchpad-save"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.frontmatter.project).toBe("P1");
    expect(body.body).toBe("新的內容\n第二行");
    expect(useWorkspaceStore.getState().selectedPromptId).toBe("new-prompt-id");
  });
});
