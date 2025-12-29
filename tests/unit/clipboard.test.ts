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
  note: "備註"
};

describe("clipboard utils", () => {
  it("builds full content with frontmatter", () => {
    const full = buildFullContent(fm, "Body text\nMore");
    expect(full).toContain("title: Test Title");
    expect(full).toContain("project: proj-1");
    expect(full).toContain("tags:");
    expect(full).toContain("- a");
    expect(full).toContain("note: 備註");
    expect(full.trim().endsWith("More")).toBe(true);
  });

  it("builds slim content stripping frontmatter", () => {
    const full = buildFullContent(fm, "Body text\nMore");
    const slim = buildSlimContent(full);
    expect(slim).toBe("Body text\nMore");
  });

  it("returns trimmed body even when frontmatter is invalid", () => {
    const raw = `---\n: :\n---\n\nBody text  `;
    const slim = buildSlimContent(raw);
    expect(slim).toContain("Body text");
    expect(slim.trim()).toBe("Body text");
  });

  it("tolerates undefined body", () => {
    const full = buildFullContent(fm as any, undefined as any);
    expect(full).toContain("title: Test Title");
    expect(full).not.toContain("undefined");
    expect(buildSlimContent(full)).toBe("");
  });
});
