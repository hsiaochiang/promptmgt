import React from "react";
import { describe, it, afterEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import RootPathAlert from "@/app/(workspace)/components/root-path-alert";
import SettingsPage from "@/app/(workspace)/settings/page";
import type { Settings } from "@/lib/types/schema";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.toString?.()} {...props}>
      {children}
    </a>
  )
}));

const baseSettings: Settings = {
  rootPath: null,
  telemetryEnabled: true,
  updateCheckEnabled: true
};

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe("RootPath 導引與設定", () => {
  it("未設定 rootPath 時顯示導引並提供設定頁連結", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(baseSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    render(<RootPathAlert />);

    expect(await screen.findByText(/未設定根路徑/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往設定" })).toHaveAttribute("href", "/settings");
  });

  it("設定頁可儲存 rootPath 並回填最新值", async () => {
    const updatedRoot = "C:\\Users\\me\\Prompts";
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (!init || init.method === "GET") {
        return new Response(JSON.stringify(baseSettings), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const body = JSON.parse(init.body as string) as Partial<Settings>;
      expect(body.rootPath).toBe(updatedRoot);
      return new Response(
        JSON.stringify({ ...baseSettings, ...body }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsPage />);

    const input = await screen.findByPlaceholderText(/Prompts/);

    fireEvent.change(input, { target: { value: updatedRoot } });
    fireEvent.click(screen.getByText("儲存路徑"));

    await waitFor(() => expect(screen.getByDisplayValue(updatedRoot)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({ method: "POST" })
    );
  });
});
