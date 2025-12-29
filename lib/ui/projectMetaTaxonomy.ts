import { commonTags, projectStatuses, projectTypes } from "../taxonomy/data";
import { toTaxonomyTable } from "../utils/taxonomy";

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
