import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: any, options: any) => {
    const MockComponent = ({ value, onChange }: any) => {
      return (
        <textarea
          data-testid="codemirror"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    };
    return MockComponent;
  },
}));

vi.mock("@/app/(workspace)/store/useWorkspaceStore", () => ({
  useWorkspaceStore: (selector: any) => selector({
    setEditorDirty: vi.fn(),
    lastSavedAt: null
  })
}));

// Mock fetch
global.fetch = vi.fn();

// Import component AFTER mocking
import PromptEditor from "@/app/(workspace)/components/prompt-editor";

describe("Conflict Dialog Integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    promptId: "p1",
    initialFrontmatter: { title: "Test Prompt" },
    initialBody: "Initial content",
    clientHash: "hash-initial",
    initialMtimeMs: 1000,
  };

  it("triggers conflict dialog after 5 seconds of conflict detection", async () => {
    render(<PromptEditor {...defaultProps} />);

    fireEvent.change(screen.getByTestId("codemirror"), { target: { value: "User edited content" } });

    (fetch as any).mockImplementation(async (url: string, options: any) => {
      if (url.includes("/api/telemetry")) return { ok: true };
      if (url.includes("/api/prompts/p1") && options?.method === "POST") {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            code: "E_CONFLICT",
            hash: "hash-server",
            mtimeMs: 2000
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/prompts/p1"), expect.objectContaining({
        method: "POST"
      }));
    });

    await waitFor(() => {
      expect(screen.getByText(/衝突警報/)).toBeInTheDocument();
    });

    expect(screen.queryByText("偵測到檔案衝突")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText("偵測到檔案衝突")).toBeInTheDocument();
    });
  });

  it("handles 'Load External' action", async () => {
    render(<PromptEditor {...defaultProps} />);
    
    fireEvent.change(screen.getByTestId("codemirror"), { target: { value: "Edit" } });
    (fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.includes("/api/telemetry")) return { ok: true };
        if (url.includes("/api/prompts/p1") && options?.method === "POST") {
            return { ok: false, status: 409, json: async () => ({ code: "E_CONFLICT", hash: "hash-server", mtimeMs: 2000 }) };
        }
        if (url.includes("/api/prompts/p1") && !options) {
            return {
                ok: true,
                json: async () => ({
                    frontmatter: { title: "Server Title" },
                    body: "Server Content",
                    hash: "hash-server",
                    mtimeMs: 2000
                })
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    act(() => { vi.advanceTimersByTime(2500); }); 
    act(() => { vi.advanceTimersByTime(5000); }); 

    const loadBtn = screen.getByText("載入外部變更");
    fireEvent.click(loadBtn);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/prompts/p1");
    });

    await waitFor(() => {
        expect(screen.getByDisplayValue("Server Content")).toBeInTheDocument();
    });

    expect(screen.queryByText("偵測到檔案衝突")).not.toBeInTheDocument();
  });

  it("handles 'Keep Local' action", async () => {
    render(<PromptEditor {...defaultProps} />);
    
    fireEvent.change(screen.getByTestId("codemirror"), { target: { value: "My Content" } });
    (fetch as any).mockImplementation(async (url: string, options: any) => {
        if (url.includes("/api/telemetry")) return { ok: true };
        if (url.includes("/api/prompts/p1") && options?.method === "POST") {
            return { ok: false, status: 409, json: async () => ({ code: "E_CONFLICT", hash: "hash-server", mtimeMs: 2000 }) };
        }
        if (url.includes("/api/prompts/p1") && !options) {
             return { ok: true, json: async () => ({ hash: "hash-server" }) };
        }
        if (url.includes("/api/prompts/p1") && options?.method === "POST") {
            return { ok: true, json: async () => ({ hash: "hash-new", mtimeMs: 3000 }) };
        }
        return { ok: true, json: async () => ({}) };
    });

    act(() => { vi.advanceTimersByTime(2500); }); 
    act(() => { vi.advanceTimersByTime(5000); }); 

    const keepBtn = screen.getByText("保留本地 (覆寫)");
    fireEvent.click(keepBtn);

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/prompts/p1");
    });
    
    await waitFor(() => {
        expect(screen.queryByText("偵測到檔案衝突")).not.toBeInTheDocument();
    });
  });
});