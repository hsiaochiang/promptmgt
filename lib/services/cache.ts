import type { Project, PromptListItem } from "../types/schema";

interface PromptMeta {
  promptCount: number;
  updatedAt?: string;
}

let promptMetaByProject: Record<string, PromptMeta> = {};

function parseTimestamp(value?: string) {
  if (!value) return NaN;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? NaN : ts;
}

export function setPromptMetaFromPrompts(prompts: PromptListItem[]) {
  const aggregated: Record<string, { promptCount: number; latestTs?: number; updatedAt?: string }> = {};

  for (const prompt of prompts) {
    const projectKey = prompt.project ?? prompt.projectId;
    if (!projectKey) continue;

    const current = aggregated[projectKey] ?? { promptCount: 0 };
    const ts = parseTimestamp(prompt.updatedAt);

    current.promptCount += 1;
    if (!Number.isNaN(ts)) {
      const hasLatest = typeof current.latestTs === "number" && !Number.isNaN(current.latestTs);
      if (!hasLatest || ts > (current.latestTs ?? 0)) {
        current.latestTs = ts;
        current.updatedAt = prompt.updatedAt;
      }
    }

    aggregated[projectKey] = current;
  }

  promptMetaByProject = Object.fromEntries(
    Object.entries(aggregated).map(([project, meta]) => [project, { promptCount: meta.promptCount, updatedAt: meta.updatedAt }])
  );
}

export function applyPromptMeta(projects: Project[]) {
  return projects.map((project) => {
    const meta = promptMetaByProject[project.name];
    if (!meta) {
      return {
        ...project,
        promptCount: 0
      };
    }
    return {
      ...project,
      promptCount: meta.promptCount,
      updatedAt: meta.updatedAt ?? project.updatedAt
    };
  });
}

export function getPromptMeta(projectName: string) {
  return promptMetaByProject[projectName];
}
