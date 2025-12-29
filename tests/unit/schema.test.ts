import { describe, expect, it } from "vitest";
import { projectSchema, promptFrontmatterSchema, settingsSchema, snippetSchema } from "@/lib/types/schema";
import { toIsoWithOffset } from "@/lib/utils/date";

const now = toIsoWithOffset();

describe("promptFrontmatterSchema", () => {
  it("trims and deduplicates tags", () => {
    const parsed = promptFrontmatterSchema.parse({
      title: "合法標題",
      project: "專案A",
      type: "其他",
      status: "草稿",
      model: "gpt-4",
      tags: [" tag ", "Tag", "b"],
      updatedAt: now
    });
    expect(parsed.tags).toEqual([
      { code: "tag", name: "tag" },
      { code: "b", name: "b" }
    ]);
  });

  it("rejects illegal filename characters in title", () => {
    const result = promptFrontmatterSchema.safeParse({
      title: "非法:/檔名",
      project: "專案A",
      type: "其他",
      status: "草稿",
      model: "gpt-4",
      tags: [],
      updatedAt: now
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  it("accepts bilingual status values", () => {
    const parsed = projectSchema.parse({
      id: "p1",
      name: "AI 工作流課程",
      status: { code: "ACTIVE", name: "進行中" },
      projectType: { code: "PRESALES", name: "售前/提案（對客戶）" },
      summary: "摘要",
      tags: [{ code: "REUSABLE", name: "可重用" }],
      promptCount: 0,
      docPath: "C:/tmp/AI-工作流課程/README.md",
      updatedAt: now
    });
    expect(parsed.status).toEqual({ code: "ACTIVE", name: "進行中" });
  });
});

describe("snippetSchema", () => {
  it("mirrors usage and usageCount", () => {
    const parsed = snippetSchema.parse({
      id: "s1",
      name: "片語",
      category: "分類",
      content: "內容",
      usageCount: 5,
      lastUsedAt: now
    });
    expect(parsed.usage).toBe(5);
    expect(parsed.usageCount).toBe(5);
  });
});

describe("settingsSchema", () => {
  it("applies defaults for pinned and telemetry", () => {
    const parsed = settingsSchema.parse({ rootPath: "C:/tmp" });
    expect(parsed.pinned).toBe(true);
    expect(parsed.telemetryEnabled).toBe(true);
    expect(parsed.layout).toEqual({});
    expect(parsed.fontScale).toBe(2);
  });
});
