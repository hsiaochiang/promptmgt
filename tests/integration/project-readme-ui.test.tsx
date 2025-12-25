import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProjectReadme from "@/app/(workspace)/components/project-readme";
import type { Project } from "@/lib/types/schema";

const baseProject: Project = {
  id: "proj-ui",
  name: "AI 工作流課程",
  status: "進行中",
  promptCount: 0,
  docPath: "/workspace/Prompts/AI 工作流課程/README.md",
  updatedAt: "2025-12-10T08:00:00+08:00",
  createdAt: "2025-12-01T08:00:00+08:00",
  path: "/workspace/AI 工作流課程"
};

const originalFetch = global.fetch;

describe("T075 - 專案 README 編輯 UI", () => {
  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-expect-error - restore to undefined when not present
      delete global.fetch;
    }
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("載入 README、顯示時間並成功儲存", async () => {
    const fetchMock = vi.fn();
    // @ts-expect-error - jsdom 全域 fetch 注入
    global.fetch = fetchMock;
    const mtimeMs = Date.parse("2024-01-02T03:04:00Z");
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: "# 初始 README",
          path: "/workspace/Prompts/AI 工作流課程/README.md",
          hash: "hash-1",
          mtimeMs
        }),
        { status: 200 }
      )
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          hash: "hash-2",
          mtimeMs: mtimeMs + 1000
        }),
        { status: 200 }
      )
    );

    const onSaved = vi.fn();
    render(<ProjectReadme project={baseProject} onSaved={onSaved} />);

    const textarea = await screen.findByPlaceholderText("撰寫專案說明…");
    await waitFor(() => expect(textarea).toHaveValue("# 初始 README"));
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/proj-ui/readme");
    expect(screen.getByText("更新：01/02 11:04")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "# 更新後 README\n內容" } });
    fireEvent.click(screen.getByText("儲存"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, requestInit] = fetchMock.mock.calls[1];
    const payload = JSON.parse((requestInit as RequestInit).body as string);
    expect(payload).toMatchObject({
      content: "# 更新後 README\n內容",
      expectedHash: "hash-1",
      expectedMtime: mtimeMs
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("PUT 錯誤時顯示錯誤訊息", async () => {
    const fetchMock = vi.fn();
    // @ts-expect-error - jsdom 全域 fetch 注入
    global.fetch = fetchMock;
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          content: "# 目前 README",
          path: "/workspace/Prompts/AI 工作流課程/README.md",
          hash: "hash-1",
          mtimeMs: Date.now()
        }),
        { status: 200 }
      )
    );
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "發生衝突" }), {
        status: 409
      })
    );

    render(<ProjectReadme project={baseProject} />);
    const textarea = await screen.findByPlaceholderText("撰寫專案說明…");
    fireEvent.change(textarea, { target: { value: "# 變更" } });
    fireEvent.click(screen.getByText("儲存"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText("發生衝突")).toBeInTheDocument());
  });
});
