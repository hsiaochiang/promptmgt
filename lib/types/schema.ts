import { z } from "zod";
import { toIsoWithOffset } from "../utils/date";
import {
  audienceTags,
  commonTags,
  deliverableTags,
  platformTags,
  projectStatuses,
  projectTypes,
  promptCategories,
  promptStages
} from "../taxonomy/data";
import { normalizeTaxonomyArray, normalizeTaxonomyValue, toTaxonomyTable } from "../utils/taxonomy";

// 中文與英文字段並行，避免破壞現有資料，同時符合 data-model 驗證規範
const ILLEGAL_FILENAME_CHARS = /[\/\\:*?"<>|]/;
const ISO_UTC8_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$/;

const isoUtc8String = z
  .string()
  .trim()
  .refine((value) => ISO_UTC8_REGEX.test(value) && !Number.isNaN(Date.parse(value)), {
    message: "必須為 ISO 8601 (UTC+08:00) 日期字串"
  });

const isoUtc8StringWithDefault = isoUtc8String.default(() => toIsoWithOffset());

const nonEmptyTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "不可為空白")
    .max(max, `長度需 <= ${max}`)
    .refine((value) => !ILLEGAL_FILENAME_CHARS.test(value), {
      message: "包含檔名禁用字元"
    });

const projectStatusTable = toTaxonomyTable(projectStatuses);
const projectTypeTable = toTaxonomyTable(projectTypes);
const promptCategoryTable = toTaxonomyTable(promptCategories);
const promptStageTable = toTaxonomyTable(promptStages);
const platformTagTable = toTaxonomyTable(platformTags);
const audienceTagTable = toTaxonomyTable(audienceTags);
const deliverableTagTable = toTaxonomyTable(deliverableTags);
const commonTagTable = toTaxonomyTable(commonTags);

const taxonomyValueObjectSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1)
});

const taxonomyValueSchema = (table?: Record<string, string>) =>
  z.preprocess(
    (val) => {
      if (val === undefined || val === null) {
        if (table) {
          const [code, name] = Object.entries(table)[0] ?? ["UNSPECIFIED", "UNSPECIFIED"];
          return { code, name };
        }
        return { code: "UNSPECIFIED", name: "UNSPECIFIED" };
      }
      return normalizeTaxonomyValue(val, table);
    },
    taxonomyValueObjectSchema
  );

const taxonomyArraySchema = (table?: Record<string, string>) =>
  z
    .preprocess((val) => normalizeTaxonomyArray(val, table), z.array(taxonomyValueObjectSchema))
    .transform((values) => values ?? []);

const promptStatusSchema = z.enum(["draft", "active", "archived", "草稿", "使用中", "已封存"]);
const promptTypeSchema = z.string().trim().min(1).max(100);

export const projectSchema = z.object({
  id: z.string().min(1).max(120),
  name: nonEmptyTrimmed(100),
  status: taxonomyValueSchema(projectStatusTable).default(projectStatuses[0]),
  summary: z.string().trim().min(1).max(200).default("未設定"),
  projectType: taxonomyValueSchema(projectTypeTable).default(projectTypes[0]),
  tags: taxonomyArraySchema(commonTagTable).default([]),
  promptCount: z.number().int().nonnegative().default(0),
  docPath: z.string().trim().min(1, "docPath 必填"),
  updatedAt: isoUtc8StringWithDefault,
  createdAt: isoUtc8StringWithDefault,
  path: z.string().optional()
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectStatus = Project["status"];

export const inboxItemSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().trim().max(200).default(""),
  content: z.string().default(""),
  hint: z.string().trim().max(500).optional(),
  createdAt: isoUtc8StringWithDefault,
  updatedAt: isoUtc8StringWithDefault
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
    lastUsedAt: isoUtc8String.optional(),
    createdAt: isoUtc8StringWithDefault,
    updatedAt: isoUtc8StringWithDefault
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
  category: taxonomyValueSchema(promptCategoryTable).default(promptCategories[0]),
  promptStage: taxonomyValueSchema(promptStageTable).default(promptStages[0]),
  model: z.string().trim().max(100).optional(),
  platformTags: taxonomyArraySchema(platformTagTable).default([]),
  audienceTags: taxonomyArraySchema(audienceTagTable).default([]),
  deliverableTags: taxonomyArraySchema(deliverableTagTable).default([]),
  tags: taxonomyArraySchema(commonTagTable).default([]),
  note: z.string().trim().max(2000).optional(),
  updatedAt: isoUtc8StringWithDefault,
  createdAt: isoUtc8StringWithDefault
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
  logPath: z.string().min(1).default("logs/app.log"),
  pathExists: z.boolean().optional(),
  createdAt: isoUtc8StringWithDefault,
  updatedAt: isoUtc8StringWithDefault
});

export type Settings = z.infer<typeof settingsSchema>;

export const databaseSchema = z.object({
  projects: z.array(projectSchema).default([]),
  inbox: z.array(inboxItemSchema).default([]),
  snippets: z.array(snippetSchema).default([]),
  settings: settingsSchema
});

export type DatabaseSchema = z.infer<typeof databaseSchema>;
