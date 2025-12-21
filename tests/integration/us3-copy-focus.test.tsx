import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import PromptHeader from "@/app/(workspace)/components/prompt-header";
import FrontmatterAccordion from "@/app/(workspace)/components/frontmatter-accordion";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";
import type { PromptFrontmatter } from "@/lib/types/schema";

const fm: PromptFrontmatter = {
  title: "測試標題",
  project: "proj-1",
  type: "其他",
  status: "使用中",
  model: "gpt-4o",
  tags: ["a", "b"],
  note: "備註",
  updatedAt: "2025-01-01T00:00:00.000Z"
};

function FocusHarness() {
  const focusMode = useWorkspaceStore((s) => s.focusMode);
  const toggleFocusMode = useWorkspaceStore((s) => s.toggleFocusMode);
  return (
    <div>
      <PromptHeader
        title={fm.title}
        frontmatter={fm}
        body={"Hello world"}
        onToggleFocus={toggleFocusMode}
      />
      <div data-testid="list-panel" className={focusMode ? "hidden" : "visible"}>
        列表區
      </div>
    </div>
  );
}

describe("US3 - 編輯/複製/專注模式", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ focusMode: false });
    const writeText = vi.fn();
    // @ts-expect-error jsdom clipboard stub
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("完整/精簡複製按鈕與快捷鍵運作", async () => {
    const writeText = vi.fn();
    // @ts-expect-error jsdom clipboard stub
    Object.assign(navigator, { clipboard: { writeText } });

    render(<PromptHeader title={fm.title} frontmatter={fm} body={"Line 1"} />);

    fireEvent.click(screen.getByRole("button", { name: "複製給模型用" }));
    expect(writeText).toHaveBeenCalled();
    expect(writeText.mock.calls[0][0]).toContain("Line 1");
    expect(writeText.mock.calls[0][0]).not.toContain("title:");

    writeText.mockClear();
    fireEvent.keyDown(window, { key: "c", ctrlKey: true, shiftKey: true });
    expect(writeText).toHaveBeenCalled();
    expect(writeText.mock.calls[0][0]).toBe("Line 1");
  });

  it("前言 accordion 預設收合並可展開", () => {
    render(<FrontmatterAccordion frontmatter={fm} onChange={() => {}} />);
    const accordion = screen.getByTestId("frontmatter-accordion");
    expect(accordion).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("frontmatter-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "展開前言" }));
    expect(screen.getByTestId("frontmatter-accordion")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("frontmatter-form")).toBeInTheDocument();
  });

  it("專注模式切換會隱藏列表區", () => {
    render(<FocusHarness />);
    const listPanel = screen.getByTestId("list-panel");
    expect(listPanel).not.toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "專注模式" }));
    expect(screen.getByTestId("list-panel")).toHaveClass("hidden");
  });
});
