import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import PromptList from "@/app/(workspace)/components/prompt-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

const initialState = useWorkspaceStore.getState();

describe("US3 - Prompts 列表導覽", () => {
  const fetchMock = vi.fn();
  const prompts = [
    {
      id: "p1",
      projectId: "proj1",
      title: "提示 A",
      type: "類型A",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: ["tag1"],
      createdAt: "2024-01-01T00:00:00+08:00",
      updatedAt: "2024-01-02T00:00:00+08:00"
    },
    {
      id: "p2",
      projectId: "proj1",
      title: "提示 B",
      type: "類型B",
      status: "草稿",
      model: "gpt-4o-mini",
      tags: ["tag2"],
      createdAt: "2024-01-03T00:00:00+08:00",
      updatedAt: "2024-01-04T00:00:00+08:00"
    }
  ];

  beforeEach(() => {
    useWorkspaceStore.setState(initialState);
    useWorkspaceStore.getState().setSelectedProjectId("proj1");
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(JSON.stringify(prompts), { status: 200 }));
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialState);
    vi.restoreAllMocks();
  });

  it("點擊提示詞會更新選取並觸發 Prompt Detail 進入", async () => {
    const onUnpinned = vi.fn();
    render(<PromptList pinned={false} onSelectedWhileUnpinned={onUnpinned} />);

    expect(await screen.findByText("提示 A")).toBeInTheDocument();
    expect(useWorkspaceStore.getState().selectedPromptId).toBe("p1");

    fireEvent.click(screen.getByText("提示 B"));

    await waitFor(() => {
      expect(useWorkspaceStore.getState().selectedPromptId).toBe("p2");
    });
    expect(onUnpinned).toHaveBeenCalledTimes(1);
  });

  it("篩選與搜尋會重新抓取列表", async () => {
    render(<PromptList />);
    await screen.findByText("提示 A");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByDisplayValue("全部狀態"), { target: { value: "草稿" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toContain("status=%E8%8D%89%E7%A8%BF");

    fireEvent.change(screen.getByPlaceholderText("搜尋標題/模型/標籤"), { target: { value: "提示" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2][0]).toContain("q=%E6%8F%90%E7%A4%BA");
  });
});
