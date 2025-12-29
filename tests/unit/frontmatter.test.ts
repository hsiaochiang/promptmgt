import { describe, expect, it } from "vitest";
import { parsePrompt } from "@/lib/utils/frontmatter";

describe("frontmatter parse defaults", () => {
  it("填補缺少 title/project 並標記 damaged", () => {
    const { frontmatter, damaged, errorCode } = parsePrompt("---\nstatus: 草稿\n---\nBody");
    expect(damaged).toBe(true);
    expect(errorCode).toBe("frontmatter_missing_required");
    expect(frontmatter?.title).toBe("untitled");
    expect(frontmatter?.project).toBe("unspecified");
    expect(frontmatter?.createdAt).toMatch(/T/);
    expect(frontmatter?.updatedAt).toMatch(/T/);
  });

  it("保留合法欄位並去除空標籤", () => {
    const { frontmatter, damaged } = parsePrompt(
      "---\ntitle: 測試\nproject: P1\ntags: [ \"a\", \"\", \"A\" ]\n---\nBody"
    );
    expect(damaged).toBe(false);
    expect(frontmatter?.tags).toEqual([{ code: "a", name: "a" }]);
  });
});
