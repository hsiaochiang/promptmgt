import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setupIsolatedWorkspace } from "../utils/testEnv";
import type { PromptListItem, Project } from "@/lib/types/schema";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) await restoreWorkspace();
});

describe("searchPrompts filters", () => {
  it("filters by project/status and falls back snippet when title lacks query", async () => {
    const { searchPrompts } = await import("@/lib/services/search");

    const prompts: PromptListItem[] = [
      {
        id: "p1",
        title: "Alpha Prompt",
        project: "Project A",
        projectId: "p1",
        type: "general",
        status: "draft",
        model: "gpt-4o",
        tags: ["alpha"],
        updatedAt: "2025-01-01T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "p2",
        title: "Beta Prompt",
        project: "Project Z",
        projectId: "p2",
        type: "general",
        status: "active",
        model: "claude",
        tags: ["beta"],
        updatedAt: "2025-01-01T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: "p3",
        title: "Gamma prompt",
        project: "Project Y",
        projectId: "p3",
        type: "general",
        status: "archived",
        model: "",
        tags: ["needle"],
        updatedAt: "2025-01-01T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z"
      }
    ];

    const filtered = searchPrompts(prompts, "beta", 5, { projectId: "Project Z" });
    expect(filtered.map((p) => p.id)).toEqual(["p2"]);

    const statusFiltered = searchPrompts(prompts, "alpha", 5, { status: "archived" });
    expect(statusFiltered).toHaveLength(0);

    const snippetResult = searchPrompts(prompts, "needle", 5);
    expect(snippetResult).toHaveLength(1);
    expect(snippetResult[0]?.snippet).toBe("Gamma prompt");
  });
});

describe("cache applyPromptMeta", () => {
  it("sets promptCount to zero when no meta is available", async () => {
    const { setPromptMetaFromPrompts, applyPromptMeta } = await import("@/lib/services/cache");

    const projects: Project[] = [
      {
        id: "proj-1",
        name: "Project A",
        status: "進行中",
        promptCount: 3,
        updatedAt: "2025-01-01T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
        path: ""
      },
      {
        id: "proj-2",
        name: "Project B",
        status: "規劃中",
        promptCount: 5,
        updatedAt: "2025-01-01T00:00:00.000Z",
        createdAt: "2025-01-01T00:00:00.000Z",
        path: ""
      }
    ];

    const prompts: PromptListItem[] = [
      {
        id: "p1",
        title: "Alpha",
        project: "Project A",
        projectId: "proj-1",
        type: "general",
        status: "draft",
        tags: [],
        updatedAt: "2025-01-02T00:00:00.000Z",
        createdAt: "2025-01-02T00:00:00.000Z",
        path: ""
      }
    ];

    setPromptMetaFromPrompts(prompts);
    const updated = applyPromptMeta(projects);
    const projectB = updated.find((p) => p.id === "proj-2");
    expect(projectB?.promptCount).toBe(0);
  });
});

describe("settings pathExists", () => {
  it("returns false when rootPath is missing", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { GET } = await import("@/app/api/settings/route");
    await updateSettings({ rootPath: null });
    const res = await GET(new Request("http://localhost/api/settings"));
    const data = await res.json();
    expect(data.pathExists).toBe(false);
  });
});

describe("inbox pagination", () => {
  it("marks hasMore when limited", async () => {
    const { GET } = await import("@/app/api/inbox/route");
    const res = await GET(new Request("http://localhost/api/inbox?limit=1&offset=0"));
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.hasMore).toBe(true);
    expect(data.total).toBeGreaterThan(1);
  });

  it("caps oversized limit to 200", async () => {
    const { GET } = await import("@/app/api/inbox/route");
    const res = await GET(new Request("http://localhost/api/inbox?limit=500"));
    const data = await res.json();
    expect(data.limit).toBe(200);
    expect(data.offset).toBe(0);
  });

  it("filters by keyword and respects offset", async () => {
    const { GET } = await import("@/app/api/inbox/route");
    const res = await GET(new Request("http://localhost/api/inbox?q=RAG&offset=0&limit=5"));
    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.items[0]?.title?.toLowerCase()).toContain("rag");

    const offsetRes = await GET(new Request("http://localhost/api/inbox?q=RAG&offset=1&limit=5"));
    const offsetData = await offsetRes.json();
    expect(offsetData.offset).toBe(1);
  });
});

describe("telemetry update check", () => {
  it("reports failure when fetch throws", async () => {
    const { checkForUpdates } = await import("@/lib/services/telemetry");
    const result = await checkForUpdates("1.0.0", {
      endpoint: "https://updates.local/check",
      fetcher: async (_input: RequestInfo | URL) => {
        throw new Error("boom");
      }
    });
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("boom");
  });
});
