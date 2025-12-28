import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
function CodeMirrorMock({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return <textarea data-testid="cm-mock" value={value} onChange={(e) => onChange(e.target.value)} />;
}

vi.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: CodeMirrorMock
}));
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => CodeMirrorMock
}));

import PromptEditor from "@/app/(workspace)/components/prompt-editor";
import { useWorkspaceStore } from "@/app/(workspace)/store/useWorkspaceStore";

const initialState = useWorkspaceStore.getState();

describe("US4 - Prompt Detail Core", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    useWorkspaceStore.setState(initialState);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ hash: "h2", mtimeMs: 2000, updatedAt: "2024-01-02T00:00:00Z" }), { status: 200 })
    );
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialState);
    vi.restoreAllMocks();
  });

  it("切換編輯/預覽 tab 並觸發 autosave 更新 lastSavedAt", async () => {
    render(
      <PromptEditor
        promptId="p1"
        initialFrontmatter={{ title: "Test", project: "P1", type: "其他", status: "草稿", tags: [], createdAt: "2024", updatedAt: "2024" }}
        initialBody="Hello"
        clientHash="h1"
        autosaveDelay={10}
      />
    );

    expect(screen.getByTestId("cm-mock")).toBeInTheDocument();
    fireEvent.click(screen.getByText("預覽"));
    expect(screen.getByText("Hello")).toBeInTheDocument();

    fireEvent.click(screen.getByText("編輯"));
    fireEvent.change(screen.getByTestId("cm-mock"), { target: { value: "Hello world" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(useWorkspaceStore.getState().lastSavedAt).toBeTruthy();
    });
  });
});
