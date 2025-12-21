import { z } from "zod";

// 中文與英文字段並行，避免破壞現有資料，同時符合 data-model 驗證規範
const ILLEGAL_FILENAME_CHARS = /[\/\\:*?"<>|]/;

const isoDateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "必須為可解析的日期" });

const nonEmptyTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "不可為空白")
    .max(max, `長度需 <= ${max}`)
    .refine((value) => !ILLEGAL_FILENAME_CHARS.test(value), {
      message: "包含檔名禁用字元"
    });

const projectStatusSchema = z.enum(["planned", "active", "archived", "規劃中", "進行中", "已結案"]);
const promptStatusSchema = z.enum(["draft", "active", "archived", "草稿", "使用中", "已封存"]);
const promptTypeSchema = z.string().trim().min(1).max(100);

const tagArraySchema = z
  .array(z.string().trim().min(1).max(50))
  .default([])
  .transform((tags) => {
    const seen = new Set<string>();
    return tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });

export const projectSchema = z.object({
  id: z.string().min(1).max(120),
  name: nonEmptyTrimmed(100),
  status: projectStatusSchema,
  promptCount: z.number().int().nonnegative(),
  updatedAt: isoDateString.optional(),
  createdAt: isoDateString.optional(),
  path: z.string().optional()
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = Project["status"];

export const inboxItemSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().trim().max(200).default(""),
  content: z.string().default(""),
  hint: z.string().trim().max(500).optional(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export type InboxItem = z.infer<typeof inboxItemSchema>;

export const snippetSchema = z
  .object({
    id: z.string().min(1).max(120),
    name: nonEmptyTrimmed(120),
    category: z.string().trim().max(120).default(""),
    content: z.string().default(""),
    usage: z.number().int().nonnegative().optional(),
    usageCount: z.number().int().nonnegative().optional(),
    lastUsedAt: isoDateString.optional()
  })
  .transform((value) => ({
    ...value,
    usage: typeof value.usage === "number" ? value.usage : value.usageCount ?? 0,
    usageCount:
      typeof value.usageCount === "number"
        ? value.usageCount
        : typeof value.usage === "number"
          ? value.usage
          : 0
  }));

export type Snippet = z.infer<typeof snippetSchema>;

export const promptFrontmatterSchema = z.object({
  title: nonEmptyTrimmed(200),
  project: nonEmptyTrimmed(100),
  type: promptTypeSchema,
  status: promptStatusSchema,
  model: z.string().trim().max(100).optional(),
  tags: tagArraySchema,
  note: z.string().trim().max(2000).optional(),
  updatedAt: isoDateString,
  createdAt: isoDateString.optional()
});

export type PromptFrontmatter = z.infer<typeof promptFrontmatterSchema>;
export type PromptStatus = PromptFrontmatter["status"];
export type PromptType = PromptFrontmatter["type"];

export const promptListItemSchema = promptFrontmatterSchema.extend({
  id: z.string().min(1).max(256),
  projectId: z.string().min(1).max(200),
  path: z.string().optional(),
  preview: z.string().optional()
});

export type PromptListItem = z.infer<typeof promptListItemSchema>;

export const promptSchema = promptListItemSchema.extend({
  content: z.string().default(""),
  frontmatter: promptFrontmatterSchema.optional()
});

export type Prompt = z.infer<typeof promptSchema>;

const layoutSchema = z.object({
  leftWidth: z.number().nonnegative().optional(),
  middleWidth: z.number().nonnegative().optional()
});

const telemetrySettingsSchema = z.object({
  enabled: z.boolean().default(true),
  exportPath: z.string().optional()
});

export const settingsSchema = z.object({
  rootPath: z.string().min(1).nullable(),
  pinned: z.boolean().default(true),
  layout: layoutSchema.default({}),
  fontScale: z.number().default(2),
  telemetryEnabled: z.boolean().default(true),
  updateCheckEnabled: z.boolean().default(true),
  telemetry: telemetrySettingsSchema.default({ enabled: true }),
  pathExists: z.boolean().optional()
});

export type Settings = z.infer<typeof settingsSchema>;

export const databaseSchema = z.object({
  projects: z.array(projectSchema).default([]),
  inbox: z.array(inboxItemSchema).default([]),
  snippets: z.array(snippetSchema).default([]),
  settings: settingsSchema
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;
