import { describe, expect, it } from "vitest";
import { parsePrompt, serializePrompt } from "@/lib/utils/frontmatter";
import type { PromptFrontmatter } from "@/lib/types/schema";

const fm: PromptFrontmatter = {
  title: "Title",
  project: "ProjectA",
  type: "其他",
  status: "草稿",
  model: "gpt-4o",
  tags: ["a", "b"],
  note: "備註",
  updatedAt: "2025-01-01T00:00:00.000Z"
};

describe("frontmatter parse/serialize", () => {
  it("roundtrips frontmatter with note and tags", () => {
    const content = serializePrompt(fm, "Body");
    const parsed = parsePrompt(content);
    expect(parsed.damaged).toBe(false);
    expect(parsed.frontmatter?.note).toBe("備註");
    expect(parsed.frontmatter?.tags).toEqual(["a", "b"]);
    expect(parsed.body.trim()).toBe("Body");
  });

  it("treats missing required fields as damaged and returns plain body", () => {
    const broken = `---\nproject: Foo\n---\n\nOnly body`;
    const parsed = parsePrompt(broken);
    expect(parsed.damaged).toBe(true);
    expect(parsed.frontmatter?.project).toBe("Foo");
    expect(parsed.frontmatter?.title).toBe("untitled");
    expect(parsed.errorCode).toBe("frontmatter_missing_required");
    expect(parsed.body.trim()).toBe("Only body");
  });

  it("fills fallback frontmatter when both title and project are missing", () => {
    const raw = `Just body without frontmatter`;
    const parsed = parsePrompt(raw);
    expect(parsed.damaged).toBe(true);
    expect(parsed.frontmatter?.title).toBe("untitled");
    expect(parsed.frontmatter?.project).toBe("unspecified");
    expect(parsed.body.trim()).toBe("Just body without frontmatter");
  });

  it("accepts notes alias and normalizes to note", () => {
    const raw = `---\ntitle: A\nproject: P\nstatus: 使用中\ntype: 其他\nnotes: 備註 alias\ntags: [x, y]\n---\n\nBody`; 
    const parsed = parsePrompt(raw);
    expect(parsed.frontmatter?.note).toBe("備註 alias");
    expect(parsed.frontmatter?.tags).toEqual(["x", "y"]);
  });

  it("handles invalid yaml by returning damaged body", () => {
    const raw = `---\n: :\n---\nBody text`;
    const parsed = parsePrompt(raw);
    expect(parsed.damaged).toBe(true);
    expect(parsed.frontmatter?.title).toBe("untitled");
    expect(parsed.errorCode).toBe("frontmatter_parse_error");
    expect(parsed.body.trim()).toBe("Body text");
  });

  it("omits undefined fields when serializing", () => {
    const withUndefined = { ...fm, createdAt: undefined, note: undefined } as PromptFrontmatter;
    const serialized = serializePrompt(withUndefined, "Body");
    expect(serialized).not.toContain("createdAt");
    expect(serialized).not.toContain("note:");
  });
});
