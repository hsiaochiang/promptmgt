import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/(workspace)/components/project-list", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-project-list" />
}));
vi.mock("@/app/(workspace)/components/inbox-list", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-inbox-list" />
}));
vi.mock("@/app/(workspace)/components/prompt-list", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-prompt-list" />
}));
vi.mock("@/app/(workspace)/components/prompt-header", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-prompt-header" />
}));
vi.mock("@/app/(workspace)/components/prompt-editor", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-prompt-editor" />
}));
vi.mock("@/app/(workspace)/components/project-readme", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-project-readme" />
}));
vi.mock("@/app/(workspace)/components/frontmatter-accordion", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-frontmatter" />
}));
vi.mock("@/app/(workspace)/components/snippet-panel", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-snippet-panel" />
}));
vi.mock("@/app/(workspace)/components/scratchpad", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-scratchpad" />
}));
vi.mock("@/app/(workspace)/components/change-report-modal", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-change-report" />
}));
vi.mock("@/app/(workspace)/components/error-boundary", () => ({
  __esModule: true,
  AsyncBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));
vi.mock("@/app/(workspace)/hooks/useSnippetInsert", () => ({
  __esModule: true,
  useSnippetInsert: (cb: (content: string) => void) => ({
    insertSnippet: (content: string) => cb(content)
  })
}));
vi.mock("@/app/(workspace)/hooks/useWorkspaceHotkeys", () => ({
  __esModule: true,
  useWorkspaceHotkeys: () => {}
}));

import WorkspaceShell from "../../app/(workspace)/workspace-shell";

describe("US1 - Topbar Tabs a11y（鍵盤 + ARIA）", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/settings")) {
        return Promise.resolve(new Response(JSON.stringify({ rootPath: null, pathExists: false }), { status: 200 }));
      }
      if (url.includes("/api/projects")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
    });
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("左右鍵移動焦點，Enter/Space 啟用並更新 aria-selected/tabpanel", async () => {
    render(<WorkspaceShell />);

    expect(await screen.findByTestId("rootpath-alert")).toBeInTheDocument();

    const projectsTab = screen.getByTestId("workspace-tab-projects");
    const promptsTab = screen.getByTestId("workspace-tab-prompts");
    const scratchpadTab = screen.getByTestId("workspace-tab-scratchpad");

    // 先確保起始狀態一致（選到 prompts）
    fireEvent.click(promptsTab);
    promptsTab.focus();

    expect(promptsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "workspace-tabpanel-prompts");

    // ArrowRight：只移動焦點，不直接切換 tab
    fireEvent.keyDown(promptsTab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(scratchpadTab);
    expect(promptsTab).toHaveAttribute("aria-selected", "true");
    expect(scratchpadTab).toHaveAttribute("aria-selected", "false");

    // Enter：啟用焦點所在 tab
    fireEvent.keyDown(scratchpadTab, { key: "Enter" });
    expect(await screen.findByTestId("mock-scratchpad")).toBeInTheDocument();
    expect(scratchpadTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "workspace-tabpanel-scratchpad");

    // ArrowLeft：移動焦點回到 prompts
    fireEvent.keyDown(scratchpadTab, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(promptsTab);

    // Space：啟用焦點所在 tab
    fireEvent.keyDown(promptsTab, { key: " " });
    expect(await screen.findByTestId("prompt-list-panel")).toBeInTheDocument();
    expect(promptsTab).toHaveAttribute("aria-selected", "true");
    expect(projectsTab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", "workspace-tabpanel-prompts");
  });
});
