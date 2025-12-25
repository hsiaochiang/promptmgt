import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProgressLogList } from "../../app/(app)/components/progress-log-list";
import { PromptListPanel } from "../../app/(app)/components/prompt-list-panel";
import { MockAppProvider, ProgressLog, Prompt, Project, useMockApp } from "../../app/(app)/providers/mock-app";
import { ToastHost } from "../../app/(app)/components/toast-host";

function RenderWithProvider({ children }: { children: React.ReactNode }) {
  return <MockAppProvider>{children}</MockAppProvider>;
}

describe("progress log state transitions", () => {
  it("should stay read-only until edit, and cancel reverts changes", () => {
    const logs: ProgressLog[] = [{ id: "l1", date: "2025-12-25", summary: "原始摘要", link: "https://example.com" }];
    const Wrapper = () => {
      const [items, setItems] = React.useState(logs);
      return (
        <ProgressLogList
          logs={items}
          viewState="success"
          onViewStateChange={() => {}}
          onAdd={() => null}
          onUpdate={(id, patch) => setItems((prev) => prev.map((l) => (l.id === id ? { ...patch } : l)))}
        />
      );
    };

    render(<Wrapper />);

    expect(screen.getByTestId("progress-log-summary")).toHaveTextContent("原始摘要");
    expect(screen.getByTestId("progress-log-link")).toHaveTextContent("連結");

    fireEvent.click(screen.getByLabelText("編輯進度"));
    const textarea = screen.getByPlaceholderText("簡短說明") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "新摘要" } });
    fireEvent.click(screen.getByTestId("progress-log-cancel"));

    expect(screen.getByTestId("progress-log-summary")).toHaveTextContent("原始摘要");

    fireEvent.click(screen.getByLabelText("編輯進度"));
    fireEvent.change(screen.getByPlaceholderText("簡短說明"), { target: { value: "保存後摘要" } });
    fireEvent.click(screen.getByText("儲存"));
    expect(screen.getByTestId("progress-log-summary")).toHaveTextContent("保存後摘要");
  });
});

describe("prompt list filter/search", () => {
  const prompts: Prompt[] = [
    { id: "p1", projectId: "pj1", title: "UI Review", body: "body text", tags: ["ui"], status: "使用中" },
    { id: "p2", projectId: "pj2", title: "Data", body: "something", tags: ["data"], status: "草稿" }
  ];
  const projects: Project[] = [
    { id: "pj1", name: "Alpha", status: "進行中", archived: false, progressLogs: [] },
    { id: "pj2", name: "Beta", status: "進行中", archived: false, progressLogs: [] }
  ];

  it("shows empty state when search yields no results", () => {
    render(
      <PromptListPanel
        prompts={prompts}
        projects={projects}
        viewState="success"
        onViewStateChange={() => {}}
        onSelect={() => {}}
        onCopy={() => {}}
        onArchive={() => {}}
        onMove={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("搜尋標題/內容/標籤"), { target: { value: "zzz" } });
    expect(screen.getByTestId("prompt-empty")).toBeInTheDocument();
  });

  it("respects status filter", () => {
    render(
      <PromptListPanel
        prompts={prompts}
        projects={projects}
        viewState="success"
        onViewStateChange={() => {}}
        onSelect={() => {}}
        onCopy={() => {}}
        onArchive={() => {}}
        onMove={() => {}}
      />
    );

    fireEvent.change(screen.getByDisplayValue("狀態：全部"), { target: { value: "草稿" } });
    expect(screen.getAllByTestId("prompt-item").length).toBe(1);
  });
});

describe("copy behavior with toast", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  const CopyHarness = () => {
    const { actions } = useMockApp();
    return (
      <div>
        <button onClick={() => actions.copyContent("hello world")}>copy</button>
        <ToastHost />
      </div>
    );
  };

  it("shows toast after copy without relying on real clipboard", async () => {
    render(
      <RenderWithProvider>
        <CopyHarness />
      </RenderWithProvider>
    );

    fireEvent.click(screen.getByText("copy"));
    expect(await screen.findByText("已複製內容")).toBeInTheDocument();
  });
});
