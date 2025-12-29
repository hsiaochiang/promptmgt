import {
  audienceTags,
  commonTags,
  deliverableTags,
  platformTags,
  promptCategories,
  promptStages
} from "../taxonomy/data";
import { toTaxonomyTable } from "../utils/taxonomy";

export const promptTaxonomy = {
  categories: promptCategories,
  stages: promptStages,
  platformTags,
  audienceTags,
  deliverableTags,
  commonTags
};

export const promptTaxonomyTables = {
  category: toTaxonomyTable(promptCategories),
  promptStage: toTaxonomyTable(promptStages),
  platform: toTaxonomyTable(platformTags),
  audience: toTaxonomyTable(audienceTags),
  deliverable: toTaxonomyTable(deliverableTags),
  common: toTaxonomyTable(commonTags)
};
