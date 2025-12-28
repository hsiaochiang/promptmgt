import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

import WorkspaceShell from "@/app/(workspace)/workspace-shell";

describe("US1 - Shell Tabs 與 RootPathAlert", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ rootPath: null, pathExists: false }), { status: 200 })
    );
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("切換 Tabs 會更新 Main/Side，RootPathAlert 仍可見且不阻擋", async () => {
    render(<WorkspaceShell />);

    expect(await screen.findByTestId("rootpath-alert")).toBeInTheDocument();
    expect(await screen.findByTestId("prompt-list-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("workspace-tab-projects"));
    expect(screen.queryByTestId("prompt-list-panel")).not.toBeInTheDocument();
    expect(await screen.findByTestId("project-list-panel")).toBeInTheDocument();
    expect(await screen.findByTestId("mock-project-list")).toBeInTheDocument();
    expect(screen.getByTestId("rootpath-alert")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("workspace-tab-scratchpad"));
    const scratchpad = await screen.findByTestId("scratchpad-textarea");
    expect(scratchpad).toBeInTheDocument();
  });
});
