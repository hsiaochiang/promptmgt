import { describe, expect, it } from "vitest";
import { applyPromptFilters, PromptLike } from "../../lib/ui/promptFilters";

const prompts: PromptLike[] = [
  { id: "1", projectId: "a", title: "Alpha", body: "text about ui", tags: ["ui"], status: "使用中", archived: false },
  { id: "2", projectId: "b", title: "Beta", body: "data things", tags: ["data"], status: "草稿", archived: false },
  { id: "3", projectId: "a", title: "Archive", body: "old", tags: [], status: "使用中", archived: true }
];

describe("applyPromptFilters", () => {
  it("filters by status and project", () => {
    const result = applyPromptFilters(prompts, { status: "草稿", projectId: "b" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("respects includeArchived toggle", () => {
    const withoutArchived = applyPromptFilters(prompts, { projectId: "a", includeArchived: false });
    expect(withoutArchived.map((p) => p.id)).toEqual(["1"]);

    const withArchived = applyPromptFilters(prompts, { projectId: "a", includeArchived: true });
    expect(withArchived.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("matches query across title/body/tags", () => {
    const result = applyPromptFilters(prompts, { query: "ui" });
    expect(result.map((p) => p.id)).toEqual(["1"]);
  });
});
