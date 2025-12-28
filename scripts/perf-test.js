process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "commonjs", moduleResolution: "node" });
require("ts-node/register/transpile-only");
const { mkdtempSync, rmSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { performance } = require("perf_hooks");
const { writePrompt, listPrompts, readPrompt } = require("../lib/fs/prompts");
const { toIsoWithOffset } = require("../lib/utils/date");

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "prompt-perf-"));
  const base = {
    title: "測試提示",
    project: "PerfProject",
    type: "其他",
    status: "草稿",
    model: "gpt-4",
    tags: [],
    createdAt: toIsoWithOffset(),
    updatedAt: toIsoWithOffset()
  };

  const metrics = [];

  for (let i = 0; i < 50; i++) {
    const fm = { ...base, title: `提示-${i}`, updatedAt: toIsoWithOffset(), createdAt: base.createdAt };
    await writePrompt(root, fm.project, fm, `內容 ${i}`);
  }

  const listStart = performance.now();
  const prompts = await listPrompts(root);
  const listEnd = performance.now();
  metrics.push({ label: "list_load_50", ms: listEnd - listStart });

  const target = prompts[0];
  if (target?.path) {
    const readStart = performance.now();
    await readPrompt(target.path);
    const readEnd = performance.now();
    metrics.push({ label: "prompt_read", ms: readEnd - readStart });
  }

  const writeFm = { ...base, title: "寫入測試", updatedAt: toIsoWithOffset(), createdAt: toIsoWithOffset() };
  const writeStart = performance.now();
  await writePrompt(root, writeFm.project, writeFm, "寫入內容");
  const writeEnd = performance.now();
  metrics.push({ label: "prompt_write", ms: writeEnd - writeStart });

  const autosaveDurations = [];
  for (let i = 0; i < 20; i++) {
    const fm = { ...base, title: `autosave-${i}`, updatedAt: toIsoWithOffset(), createdAt: toIsoWithOffset() };
    const start = performance.now();
    await writePrompt(root, fm.project, fm, `autosave ${i}`);
    autosaveDurations.push(performance.now() - start);
  }
  metrics.push({ label: "autosave_p95", ms: percentile(autosaveDurations, 95) });

  metrics.forEach((m) => console.log(`${m.label}: ${m.ms.toFixed(2)} ms`));

  rmSync(root, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
