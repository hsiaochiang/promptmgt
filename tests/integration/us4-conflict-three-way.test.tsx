import React from "react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

describe("US4 - 409 三選一", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    useWorkspaceStore.setState(initialState);
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => new Response(JSON.stringify({ hash: "noop", mtimeMs: 999, updatedAt: "2024-01-02T00:00:00Z" }), { status: 200 }));
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    useWorkspaceStore.setState(initialState);
    vi.restoreAllMocks();
  });

  it("衝突後可選擇重新載入 / 另存副本 / 強制覆寫", async () => {
    // autosave -> 409
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "conflict", details: { currentHash: "server-hash", currentMtime: 123 } }), { status: 409 })
    );
    // reload external
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ frontmatter: { title: "外部", project: "P1", type: "其他", status: "草稿", tags: [] }, body: "ext", hash: "server-hash", mtimeMs: 123 }), { status: 200 })
    );
    // overwrite fetch current
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ hash: "server-hash", mtimeMs: 123, frontmatter: { title: "外部", project: "P1", type: "其他", status: "草稿", tags: [] }, body: "ext" }), { status: 200 })
    );
    // overwrite save
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ hash: "local-hash", mtimeMs: 200, updatedAt: "2024-01-02T00:00:00Z" }), { status: 200 })
    );
    // save copy
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "copy-id", hash: "copy-hash", mtimeMs: 300, frontmatter: { title: "題目 副本", project: "P1", type: "其他", status: "草稿", tags: [] } }), { status: 201 })
    );

    render(
      <PromptEditor
        promptId="p1"
        initialFrontmatter={{ title: "題目", project: "P1", type: "其他", status: "草稿", tags: [], createdAt: "2024", updatedAt: "2024" }}
        initialBody="Hello"
        clientHash="h1"
        autosaveDelay={10}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.getByText(/衝突警報/)).toBeInTheDocument();
    expect(screen.getByTestId("conflict-load-external")).toBeInTheDocument();
    expect(screen.getByTestId("conflict-save-copy")).toBeInTheDocument();
    expect(screen.getByTestId("conflict-keep-local")).toBeInTheDocument();

    const initialCalls = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByTestId("conflict-save-copy"));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(initialCalls));
  });
});
