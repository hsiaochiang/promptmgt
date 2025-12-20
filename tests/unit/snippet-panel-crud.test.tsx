import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import SnippetPanel from "@/app/(workspace)/components/snippet-panel";
import type { Snippet } from "@/lib/types/schema";

const baseSnippets: Snippet[] = [
  {
    id: "s-1",
    name: "片語一",
    category: "角色",
    content: "內容一",
    usage: 0,
    lastUsedAt: null
  },
  {
    id: "s-2",
    name: "片語二",
    category: "格式",
    content: "內容二",
    usage: 0,
    lastUsedAt: null
  }
];

describe("SnippetPanel CRUD", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it("新增/編輯/刪除片語更新列表", async () => {
    const responses: Record<string, any> = {
      GET: baseSnippets,
      POST: { id: "s-3", name: "新片語", category: "其他", content: "新增內容", usage: 0, lastUsedAt: null },
      PATCH: { id: "s-1", name: "片語一-更新", category: "角色", content: "內容一", usage: 0, lastUsedAt: null },
      DELETE: { ok: true }
    };

    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const payload = responses[method];
      if (!payload) return new Response("not mocked", { status: 500 });
      const status = method === "POST" ? 201 : 200;
      return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<SnippetPanel onInsert={async () => undefined} />);

    // 初始列表
    await screen.findByText("片語一");
    expect(screen.getByText(/2 條/)).toBeInTheDocument();

    // 新增
    fireEvent.click(screen.getByTestId("snippet-add-trigger"));
    fireEvent.change(screen.getByPlaceholderText("名稱"), { target: { value: "新片語" } });
    fireEvent.change(screen.getByPlaceholderText("分類"), { target: { value: "其他" } });
    fireEvent.change(screen.getByPlaceholderText("內容"), { target: { value: "新增內容" } });
    fireEvent.click(screen.getByTestId("snippet-save"));

    await waitFor(() => screen.getByText("新片語"));
    expect(screen.getByText(/3 條/)).toBeInTheDocument();

    // 編輯
    fireEvent.click(screen.getByTestId("snippet-edit-s-1"));
    fireEvent.change(screen.getByPlaceholderText("名稱"), { target: { value: "片語一-更新" } });
    fireEvent.click(screen.getByText("更新"));

    await waitFor(() => screen.getByText("片語一-更新"));

    // 刪除
    fireEvent.click(screen.getByTestId("snippet-delete-s-2"));
    await waitFor(() => expect(screen.queryByText("片語二")).not.toBeInTheDocument());
    expect(screen.getByText(/2 條/)).toBeInTheDocument();
  });
});
