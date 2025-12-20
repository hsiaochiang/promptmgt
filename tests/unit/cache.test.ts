import { describe, expect, it } from "vitest";
import { applyPromptMeta, setPromptMetaFromPrompts } from "@/lib/services/cache";

const prompts = [
  {
    id: "1",
    projectId: "proj-1",
    project: "proj-1",
    title: "A",
    type: "其他" as const,
    status: "使用中" as const,
    model: "gpt-4",
    tags: [],
    updatedAt: "2025-01-02T00:00:00.000Z"
  },
  {
    id: "2",
    projectId: "proj-1",
    project: "proj-1",
    title: "B",
    type: "其他" as const,
    status: "使用中" as const,
    model: "gpt-4",
    tags: [],
    updatedAt: "2025-01-05T00:00:00.000Z"
  },
  {
    id: "3",
    projectId: "proj-2",
    project: "proj-2",
    title: "C",
    type: "其他" as const,
    status: "草稿" as const,
    model: "gpt-4",
    tags: [],
    updatedAt: undefined
  }
];

describe("cache meta", () => {
  it("aggregates prompt counts and latest updatedAt per project", () => {
    setPromptMetaFromPrompts(prompts as any);
    const projects = [
      { id: "p1", name: "proj-1", status: "進行中", promptCount: 0, updatedAt: "2025-01-01" },
      { id: "p2", name: "proj-2", status: "進行中", promptCount: 0, updatedAt: "2025-01-01" }
    ];
    const withMeta = applyPromptMeta(projects as any);
    const p1 = withMeta.find((p) => p.name === "proj-1")!;
    const p2 = withMeta.find((p) => p.name === "proj-2")!;

    expect(p1.promptCount).toBe(2);
    expect(p1.updatedAt).toBe("2025-01-05T00:00:00.000Z");
    expect(p2.promptCount).toBe(1);
    expect(p2.updatedAt).toBe("2025-01-01");
  });
});
