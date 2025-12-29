import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PromptListItem } from "@/lib/types/schema";
import { setupIsolatedWorkspace } from "../utils/testEnv";

let restoreWorkspace: (() => Promise<void>) | undefined;

beforeEach(async () => {
  restoreWorkspace = await setupIsolatedWorkspace();
});

afterEach(async () => {
  if (restoreWorkspace) {
    await restoreWorkspace();
  }
});

describe("prompts listing contract", () => {
  it("returns required fields sorted by updatedAt descending", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/prompts/route");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });

    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "Older Prompt",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        model: "gpt-3.5",
        tags: ["alpha"],
        updatedAt: "2024-12-30T00:00:00.000Z"
      },
      "Older body"
    );

    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "Newer Prompt",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        model: "gpt-4",
        tags: ["beta"],
        updatedAt: "2025-01-02T00:00:00.000Z"
      },
      "Newer body"
    );

    await writePrompt(
      rootPath,
      "proj-2",
      {
        title: "Other Project",
        project: "proj-2",
        type: "其他",
        status: "草稿",
        model: "gpt-4",
        tags: ["gamma"],
        updatedAt: "2025-01-03T00:00:00.000Z"
      },
      "Other body"
    );

    const response = await GET(new Request("http://localhost/api/prompts?projectId=proj-1"));
    const prompts = (await response.json()) as PromptListItem[];

    expect(prompts.length).toBe(2);
    expect(prompts.every((p) => p.projectId === "proj-1")).toBe(true);
    expect(prompts[0].title).toBe("Newer Prompt");
    expect(prompts[1].title).toBe("Older Prompt");
    expect(prompts[0]).toMatchObject({
      id: expect.any(String),
      projectId: "proj-1",
      type: "結構設計",
      status: "使用中",
      model: "gpt-4",
      tags: [{ code: "beta", name: "beta" }],
      updatedAt: "2025-01-02T00:00:00.000Z"
    });
  });
});
