import { describe, expect, it } from "vitest";
import { buildFullContent, buildSlimContent } from "@/lib/utils/clipboard";

const fm = {
  title: "Test Title",
  project: "proj-1",
  type: "其他" as const,
  status: "使用中" as const,
  model: "gpt-4",
  tags: ["a", "b"],
  updatedAt: "2025-01-01T00:00:00.000Z",
  notes: "備註"
};

describe("clipboard utils", () => {
  it("builds full content with frontmatter", () => {
    const full = buildFullContent(fm, "Body text\nMore");
    expect(full).toContain("title: Test Title");
    expect(full).toContain("project: proj-1");
    expect(full).toContain("tags: [a, b]");
    expect(full.trim().endsWith("More")).toBe(true);
  });

  it("builds slim content stripping frontmatter", () => {
    const full = buildFullContent(fm, "Body text\nMore");
    const slim = buildSlimContent(full);
    expect(slim).toBe("Body text\nMore");
  });
});
