import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { performance } from "perf_hooks";
import { writePrompt, listPrompts, readPrompt } from "@/lib/fs/prompts";
import { toIsoWithOffset } from "@/lib/utils/date";
import type { PromptFrontmatter } from "@/lib/types/schema";

type Metric = { label: string; ms: number };

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "prompt-perf-"));
  const frontmatterBase: PromptFrontmatter = {
    title: "測試提示",
    project: "PerfProject",
    type: "其他",
    status: "草稿",
    model: "gpt-4",
    tags: [],
    createdAt: toIsoWithOffset(),
    updatedAt: toIsoWithOffset()
  };

  const metrics: Metric[] = [];

  // 準備 50 篇提示詞
  for (let i = 0; i < 50; i++) {
    const fm = { ...frontmatterBase, title: `提示-${i}`, updatedAt: toIsoWithOffset(), createdAt: frontmatterBase.createdAt };
    await writePrompt(root, fm.project, fm, `內容 ${i}`);
  }

  // 列表載入
  const tListStart = performance.now();
  const prompts = await listPrompts(root);
  const tListEnd = performance.now();
  metrics.push({ label: "list_load_50", ms: tListEnd - tListStart });

  // 讀取單篇
  const target = prompts[0];
  if (target?.path) {
    const tReadStart = performance.now();
    await readPrompt(target.path);
    const tReadEnd = performance.now();
    metrics.push({ label: "prompt_read", ms: tReadEnd - tReadStart });
  }

  // 單次寫入
  const writeFm = { ...frontmatterBase, title: "寫入測試", updatedAt: toIsoWithOffset(), createdAt: toIsoWithOffset() };
  const tWriteStart = performance.now();
  await writePrompt(root, writeFm.project, writeFm, "寫入內容");
  const tWriteEnd = performance.now();
  metrics.push({ label: "prompt_write", ms: tWriteEnd - tWriteStart });

  // autosave p95 模擬（20 次快速寫入）
  const autosaveDurations: number[] = [];
  for (let i = 0; i < 20; i++) {
    const fm = { ...frontmatterBase, title: `autosave-${i}`, updatedAt: toIsoWithOffset(), createdAt: toIsoWithOffset() };
    const start = performance.now();
    await writePrompt(root, fm.project, fm, `autosave ${i}`);
    autosaveDurations.push(performance.now() - start);
  }
  metrics.push({ label: "autosave_p95", ms: percentile(autosaveDurations, 95) });

  metrics.forEach((m) => {
    console.log(`${m.label}: ${m.ms.toFixed(2)} ms`);
  });

  rmSync(root, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
