import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import TopBar from "@/app/(workspace)/components/top-bar";

describe("topbar-change-report-quickadd", () => {
  it("renders change report entry and triggers handler", () => {
    const onShowChangeReport = vi.fn();
    render(
      <TopBar
        onShowChangeReport={onShowChangeReport}
        onCreatePrompt={() => {}}
        onToggleSnippetPanel={() => {}}
        snippetOpen={false}
      />
    );

    const entry = screen.getByText("今日變更報告");
    expect(entry).toBeInTheDocument();
    fireEvent.click(entry);
    expect(onShowChangeReport).toHaveBeenCalled();
  });

  it("triggers quick add handler and reflects loading state", () => {
    const onCreatePrompt = vi.fn();
    const { rerender } = render(
      <TopBar
        onShowChangeReport={() => {}}
        onCreatePrompt={onCreatePrompt}
        onToggleSnippetPanel={() => {}}
        snippetOpen={false}
        creating={false}
      />
    );

    const quickAdd = screen.getByText("新增提示詞");
    fireEvent.click(quickAdd);
    expect(onCreatePrompt).toHaveBeenCalled();

    rerender(
      <TopBar
        onShowChangeReport={() => {}}
        onCreatePrompt={onCreatePrompt}
        onToggleSnippetPanel={() => {}}
        snippetOpen={false}
        creating={true}
      />
    );
    expect(screen.getByText("建立中…")).toBeInTheDocument();
  });
});
