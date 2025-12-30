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
import { toTaxonomyTable } from "../utils/taxonomy";

export type ProjectMetaTaxonomyOption = { code: string; name: string };

export const CATEGORY_OPTIONS: ProjectMetaTaxonomyOption[] = promptCategories;
export const STAGE_OPTIONS: ProjectMetaTaxonomyOption[] = promptStages;
export const PLATFORM_OPTIONS: ProjectMetaTaxonomyOption[] = platformTags;
export const DELIVERABLE_OPTIONS: ProjectMetaTaxonomyOption[] = deliverableTags;
export const AUDIENCE_OPTIONS: ProjectMetaTaxonomyOption[] = audienceTags;
export const COMMON_TAG_OPTIONS: ProjectMetaTaxonomyOption[] = commonTags;

export function labelFromOptions(codeOrName: string | null | undefined, options: ProjectMetaTaxonomyOption[]) {
  const value = (codeOrName ?? "").trim();
  if (!value) return "";
  const lowered = value.toLowerCase();
  const match = options.find((o) => o.code.toLowerCase() === lowered || o.name.toLowerCase() === lowered);
  return match?.name ?? value;
}

export const projectMetaTaxonomy = {
  projectStatuses,
  projectTypes,
  commonTags
};

export const projectMetaTaxonomyTables = {
  status: toTaxonomyTable(projectStatuses),
  projectType: toTaxonomyTable(projectTypes),
  common: toTaxonomyTable(commonTags)
};
