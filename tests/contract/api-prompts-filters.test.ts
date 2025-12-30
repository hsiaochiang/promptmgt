import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PromptListItem } from "@/lib/types/schema";
import { audienceTags, commonTags, deliverableTags, platformTags, promptCategories, promptStages } from "@/lib/taxonomy/data";
import { ensureIsoUtc8 } from "@/lib/utils/date";
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

describe("/api/prompts filters", () => {
  it("supports status/category/stage/platformTag/tag/q/limit filters", async () => {
    const { updateSettings } = await import("@/lib/services/settings");
    const { writePrompt } = await import("@/lib/fs/prompts");
    const { GET } = await import("@/app/api/prompts/route");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });

    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "A - ChatGPT reusable",
        project: "proj-1",
        type: "結構設計",
        status: "使用中",
        category: promptCategories[0],
        promptStage: promptStages[1] ?? promptStages[0],
        model: "gpt-4",
        platformTags: [platformTags.find((t) => t.code === "CHATGPT") ?? platformTags[0]],
        audienceTags: [audienceTags[0]],
        deliverableTags: [deliverableTags[0]],
        tags: [commonTags.find((t) => t.code === "REUSABLE") ?? commonTags[0]],
        updatedAt: ensureIsoUtc8("2025-01-02T00:00:00.000Z"),
        createdAt: ensureIsoUtc8("2025-01-01T00:00:00.000Z")
      },
      "body A"
    );

    await writePrompt(
      rootPath,
      "proj-1",
      {
        title: "B - Claude blocked",
        project: "proj-1",
        type: "其他",
        status: "草稿",
        category: promptCategories[1] ?? promptCategories[0],
        promptStage: promptStages[0],
        model: "claude-3.5",
        platformTags: [platformTags.find((t) => t.code === "CLAUDE") ?? platformTags[0]],
        audienceTags: [],
        deliverableTags: [],
        tags: [commonTags.find((t) => t.code === "BLOCKED") ?? commonTags[0]],
        updatedAt: ensureIsoUtc8("2025-01-03T00:00:00.000Z"),
        createdAt: ensureIsoUtc8("2025-01-01T00:00:00.000Z")
      },
      "body B"
    );

    await writePrompt(
      rootPath,
      "proj-2",
      {
        title: "C - other project",
        project: "proj-2",
        type: "其他",
        status: "使用中",
        category: promptCategories[0],
        promptStage: promptStages[0],
        model: "gpt-4",
        platformTags: [],
        audienceTags: [],
        deliverableTags: [],
        tags: [],
        updatedAt: ensureIsoUtc8("2025-01-04T00:00:00.000Z"),
        createdAt: ensureIsoUtc8("2025-01-01T00:00:00.000Z")
      },
      "body C"
    );

    // status
    {
      const response = await GET(new Request("http://localhost/api/prompts?status=%E8%8D%89%E7%A8%BF"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toContain("Claude");
    }

    // category
    {
      const response = await GET(new Request(`http://localhost/api/prompts?category=${promptCategories[0].code}`));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.some((p) => p.title.includes("ChatGPT"))).toBe(true);
      expect(prompts.some((p) => p.title.includes("other project"))).toBe(true);
    }

    // stage
    {
      const stage = (promptStages[1] ?? promptStages[0]).code;
      const response = await GET(new Request(`http://localhost/api/prompts?promptStage=${stage}`));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toContain("ChatGPT");
    }

    // platformTag
    {
      const response = await GET(new Request("http://localhost/api/prompts?platformTag=CHATGPT"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toContain("ChatGPT");
    }

    // tag
    {
      const response = await GET(new Request("http://localhost/api/prompts?tag=REUSABLE"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toContain("reusable");
    }

    // q
    {
      const response = await GET(new Request("http://localhost/api/prompts?q=chatgpt"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toContain("ChatGPT");
    }

    // limit parsing/capping branch
    {
      const response = await GET(new Request("http://localhost/api/prompts?limit=2000"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBeLessThanOrEqual(1000);
    }
    {
      const response = await GET(new Request("http://localhost/api/prompts?limit=not-a-number"));
      const prompts = (await response.json()) as PromptListItem[];
      expect(prompts.length).toBeGreaterThan(0);
    }
  });
});
