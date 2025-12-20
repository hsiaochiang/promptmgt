import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import PromptList from "@/app/(workspace)/components/prompt-list";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";
import type { PromptListItem } from "@/lib/types/schema";

describe("PromptList 行為", () => {
  const prompts: PromptListItem[] = [
    {
      id: "p-1",
      title: "提示 1",
      projectId: "proj-1",
      project: "proj-1",
      type: "其他",
      status: "使用中",
      model: "gpt-4o-mini",
      tags: ["a"],
      updatedAt: "2025-01-01"
    },
    {
      id: "p-2",
      title: "提示 2",
      projectId: "proj-1",
      project: "proj-1",
      type: "其他",
      status: "草稿",
      model: "gpt-4o-mini",
      tags: ["b"],
      updatedAt: "2025-01-02"
    }
  ];

  afterEach(() => {
    cleanup();
    useWorkspaceStore.setState({ selectedProjectId: null, selectedPromptId: null, filterStatus: "全部" });
    vi.unstubAllGlobals();
  });

  it("點擊列表選取提示詞並呼叫刪除回調", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(prompts), { status: 200 }))
    );

    const onDelete = vi.fn().mockResolvedValue(undefined);
    useWorkspaceStore.setState({ selectedProjectId: "proj-1" });
    render(<PromptList onDeletePrompt={onDelete} />);

    await screen.findByText("提示 1");
    fireEvent.click(screen.getByText("提示 2"));
    expect(useWorkspaceStore.getState().selectedPromptId).toBe("p-2");

    const deleteButtons = await screen.findAllByRole("button", { name: "刪除" });
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("p-1");
  });

  it("刪除選取提示詞後刷新列表並選取下一筆", async () => {
    const responses = [prompts, [prompts[1]]];
    const fetchMock = vi.fn(async () => {
      const payload = responses.length > 0 ? responses.shift()! : [prompts[1]];
      return new Response(JSON.stringify(payload), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    useWorkspaceStore.setState({ selectedProjectId: "proj-1", selectedPromptId: "p-1", filterStatus: "全部" });

    function Wrapper() {
      const [refreshKey, setRefreshKey] = useState(0);
      return (
        <PromptList
          refreshKey={refreshKey}
          onDeletePrompt={async (id) => {
            expect(id).toBe("p-1");
            useWorkspaceStore.setState({ selectedPromptId: null });
            setRefreshKey((k) => k + 1);
          }}
        />
      );
    }

    render(<Wrapper />);

    await screen.findByText("提示 1");
    expect(useWorkspaceStore.getState().selectedPromptId).toBe("p-1");

    const deleteButtons = await screen.findAllByRole("button", { name: "刪除" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText("提示 2");
    await waitFor(() => expect(useWorkspaceStore.getState().selectedPromptId).toBe("p-2"));
    expect(screen.queryByText("提示 1")).not.toBeInTheDocument();
    expect(screen.getByText("共 1 篇提示詞")).toBeInTheDocument();
  });
});
