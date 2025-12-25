import { describe, expect, it } from "vitest";
import { parsePrompt } from "@/lib/utils/frontmatter";

describe("frontmatter fallback for damaged yaml", () => {
  it("使用 fallback 專案與標題並移除損壞的 frontmatter 區塊", () => {
    const raw = `---\ntitle: "未完成 [\nproject: Demo\n---\n正文內容`;
    const parsed = parsePrompt(raw, { fallbackProject: "DemoProj", fallbackTitle: "BrokenFile" });

    expect(parsed.damaged).toBe(true);
    expect(parsed.errorCode).toBe("frontmatter_parse_error");
    expect(parsed.frontmatter?.project).toBe("DemoProj");
    expect(parsed.frontmatter?.title).toBe("BrokenFile");
    expect(parsed.body.trim()).toBe("正文內容");
  });

  it("缺少必填欄位時填入預設並標示需修復", () => {
    const raw = `---\ntitle:\nmodel: gpt-4\n---\n內容`;
    const parsed = parsePrompt(raw, { fallbackProject: "預設專案" });

    expect(parsed.damaged).toBe(true);
    expect(parsed.errorCode).toBe("frontmatter_missing_required");
    expect(parsed.frontmatter?.project).toBe("預設專案");
    expect(parsed.frontmatter?.title).toBe("untitled");
  });
});
