import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { access, mkdir, writeFile } from "fs/promises";
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

describe("LowDB adapter", () => {
  it("seeds database file with defaults", async () => {
    const { getDb } = await import("@/lib/db");

    const db = await getDb();
    expect(db.data?.projects.length).toBeGreaterThan(0);
    await access(process.env.DB_FILE!);
  });

  it("reuses existing database content without reseeding", async () => {
    const dbPath = process.env.DB_FILE!;
    await writeFile(
      dbPath,
      JSON.stringify({
        projects: [],
        inbox: [],
        snippets: [],
        settings: { rootPath: null, telemetryEnabled: false, updateCheckEnabled: false }
      })
    );

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    expect(db.data?.projects).toEqual([]);
    expect(db.data?.settings.telemetryEnabled).toBe(false);
  });

  it("re-seeds when database file is invalid", async () => {
    const dbPath = process.env.DB_FILE!;
    await writeFile(dbPath, "null");

    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    expect(db.data?.projects.length).toBeGreaterThan(0);
  });
});

describe("prompt file system adapter", () => {
  it("writes prompts with sanitized filenames and lists them", async () => {
    const { writePrompt, listPrompts } = await import("@/lib/fs/prompts");
    const { updateSettings } = await import("@/lib/services/settings");

    const rootPath = process.env.DEFAULT_ROOT!;
    await updateSettings({ rootPath });

    const frontmatter = {
      title: "非法:/檔名",
      project: "proj-1",
      type: "其他" as const,
      status: "草稿" as const,
      model: "gpt-4",
      tags: ["a"],
      updatedAt: new Date().toISOString()
    };

    const result = await writePrompt(rootPath, "專案A", frontmatter, "內容");
    expect(result.filePath.endsWith("非法-檔名.md")).toBe(true);
    const reserved = await writePrompt(rootPath, "CON", { ...frontmatter, title: "COM1" }, "內容");
    expect(reserved.filePath.includes("COM1_")).toBe(true);
    const prompts = await listPrompts(rootPath);
    expect(prompts.length).toBeGreaterThanOrEqual(2);
    const first = prompts.find((p) => p.projectId === "專案A");
    expect(first).toMatchObject({
      projectId: "專案A",
      title: "非法:/檔名",
      status: "草稿",
      tags: ["a"]
    });
  });

  it("skips non-directory entries and files without frontmatter", async () => {
    const { listPrompts } = await import("@/lib/fs/prompts");
    const rootPath = process.env.DEFAULT_ROOT!;

    await mkdir(rootPath, { recursive: true });
    await writeFile(`${rootPath}/README.txt`, "no prompts here");
    await mkdir(`${rootPath}/empty`, { recursive: true });
    await writeFile(`${rootPath}/empty/invalid.md`, "---\n: bad yaml\n---\nbody");

    const prompts = await listPrompts(rootPath);
    expect(prompts).toEqual([]);
  });

  it("returns empty list when rootPath is falsy or inaccessible", async () => {
    const { listPrompts } = await import("@/lib/fs/prompts");

    const emptyRoot = await listPrompts("");
    expect(emptyRoot).toEqual([]);

    const missingRoot = await listPrompts("D:/path/does/not/exist");
    expect(missingRoot).toEqual([]);
  });
});

describe("frontmatter parsing", () => {
  it("parses valid frontmatter and marks damaged content", async () => {
    const { parsePrompt, serializePrompt } = await import("@/lib/utils/frontmatter");
    const frontmatter = {
      title: "Valid",
      project: "proj-1",
      type: "其他" as const,
      status: "使用中" as const,
      model: "gpt-4",
      tags: ["tag"],
      updatedAt: "2024-01-01T00:00:00.000Z"
    };
    const serialized = serializePrompt(frontmatter, "body text");
    const parsed = parsePrompt(serialized);
    expect(parsed.damaged).toBe(false);
    expect(parsed.frontmatter).toMatchObject(frontmatter);
    expect(parsed.body.trim()).toBe("body text");

    const broken = parsePrompt("---\n: bad yaml\n---\ntext");
    expect(broken.damaged).toBe(true);
    expect(broken.errorCode).toBe("frontmatter_parse_error");
    expect(broken.frontmatter?.title).toBe("untitled");
    expect(broken.frontmatter?.project).toBe("unspecified");
    expect(broken.body.trim()).toBe("text");
  });

  it("flags missing required keys as damaged but keeps data", async () => {
    const { parsePrompt } = await import("@/lib/utils/frontmatter");
    const parsed = parsePrompt("---\nproject: P1\n---\nbody");
    expect(parsed.damaged).toBe(true);
    expect(parsed.frontmatter?.project).toBe("P1");
  });
});

describe("conflict detection", () => {
  it("detects conflicts by mtime or hash", async () => {
    const { computeHash, hasConflict } = await import("@/lib/services/conflict");
    const content = "hello";
    const hash = computeHash(content);
    expect(hash).toHaveLength(64);

    expect(
      hasConflict({
        localMtime: 100,
        externalMtime: 200,
        localHash: hash,
        externalHash: hash
      })
    ).toBe(true);

    expect(
      hasConflict({
        localMtime: 200,
        externalMtime: 100,
        localHash: hash,
        externalHash: computeHash("changed")
      })
    ).toBe(true);

    expect(
      hasConflict({ localMtime: 200, externalMtime: 100, localHash: hash, externalHash: hash })
    ).toBe(false);

    expect(hasConflict({ localMtime: 100, externalMtime: 90 })).toBe(false);
  });

  it("builds conflict events with reasons", async () => {
    const { computeHash, detectConflict, createConflictEvent } = await import("@/lib/services/conflict");
    const localHash = computeHash("local");
    const externalHash = computeHash("external");

    const result = detectConflict({
      localMtime: 100,
      externalMtime: 150,
      localHash,
      externalHash
    });

    expect(result.conflict).toBe(true);
    expect(result.reasons).toEqual(["mtime", "hash"]);

    const event = createConflictEvent(result, "view-diff", { filePath: "/tmp/prompt.md" });
    expect(event.decision).toBe("view-diff");
    expect(event.reasons).toEqual(["mtime", "hash"]);
    expect(event.hashes).toMatchObject({ local: localHash, external: externalHash });
    expect(event.context?.filePath).toContain("prompt.md");
    expect(event.id).toBeTruthy();
  });
});

describe("search service", () => {
  it("matches prompts by title or tags and returns snippets", async () => {
    const { searchPrompts } = await import("@/lib/services/search");
    const prompts = [
      {
        id: "1",
        projectId: "p1",
        title: "RAG 搜尋樣本",
        project: "p1",
        type: "其他" as const,
        status: "使用中" as const,
        model: "gpt-4",
        tags: ["vector", "retrieval"],
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    ];

    const results = searchPrompts(prompts, "vector", 5);
    expect(results).toHaveLength(1);
    expect(results[0].snippet.length).toBeGreaterThan(0);

    const empty = searchPrompts(prompts, "", 5);
    expect(empty).toHaveLength(0);
  });

  it("stops when reaching the result cap", async () => {
    const { searchPrompts } = await import("@/lib/services/search");
    const prompts = Array.from({ length: 5 }).map((_, i) => ({
      id: `${i + 1}`,
      projectId: "p1",
      project: "p1",
      title: `Sample prompt ${i}`,
      type: "其他" as const,
      status: "使用中" as const,
      model: "gpt-4",
      tags: ["match"],
      updatedAt: "2024-01-01T00:00:00.000Z"
    }));

    const capped = searchPrompts(prompts, "match", 2);
    expect(capped).toHaveLength(2);
  });
});

describe("filename sanitizer", () => {
  it("replaces illegal characters and trims whitespace", async () => {
    const { sanitizeFilename } = await import("@/lib/utils/sanitizeFilename");
    expect(sanitizeFilename("  a/b:c* ")).toBe("a-b-c-");
    expect(sanitizeFilename("   ")).toBe("untitled");
  });
});

describe("clipboard utils", () => {
  it("builds full and slim content correctly", async () => {
    const { buildFullContent, buildSlimContent } = await import("@/lib/utils/clipboard");
    const frontmatter = {
      title: "Test",
      project: "proj-1",
      type: "其他" as const,
      status: "使用中" as const,
      model: "gpt-4",
      tags: ["x", "y"],
      updatedAt: "2024-01-01T00:00:00.000Z"
    };
    const full = buildFullContent(frontmatter, "Body text");
    expect(full).toContain("title: Test");
      expect(full).toContain("tags:");
      expect(full).toContain("- x");
    expect(full.trim().endsWith("Body text")).toBe(true);

    const slim = buildSlimContent(full);
    expect(slim).toBe("Body text");
  });
});
