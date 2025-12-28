import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Scratchpad from "@/app/(workspace)/components/scratchpad";

describe("US5 - Scratchpad", () => {
  const writeText = vi.fn();
  const projects = [
    { id: "p1", name: "P1", status: "進行中", promptCount: 0, docPath: "/tmp", createdAt: "2024", updatedAt: "2024" }
  ];

  beforeEach(() => {
    writeText.mockReset();
    Object.assign(navigator, { clipboard: { writeText } });
    window.localStorage.removeItem("pm-scratchpad-items-v1");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("快速新增/加入列表/複製內容", async () => {
    render(<Scratchpad projects={projects as any} />);

    const textarea = screen.getByTestId("scratchpad-textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "新的內容\n第二行" } });
    fireEvent.click(screen.getByTestId("scratchpad-add"));

    expect(screen.getByTestId("scratchpad-count")).toHaveTextContent("1");
    expect(screen.getByText("新的內容")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("scratchpad-copy"));
    expect(writeText).toHaveBeenCalledWith("新的內容\n第二行");
  });
});
