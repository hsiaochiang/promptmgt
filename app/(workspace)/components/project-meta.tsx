"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types/schema";

type ProjectMeta = {
  category?: string;
  stage?: string;
  platforms?: string[];
  deliverables?: string[];
  audiences?: string[];
  commonTags?: string[];
  updatedAt?: string;
};

const CATEGORY_OPTIONS = [
  { code: "PRESALES", name: "售前/提案（對客戶）" },
  { code: "DELIVERY", name: "交付/導入（對客戶）" },
  { code: "INTERNAL_PRODUCT", name: "內部工具/產品化" },
  { code: "AUTOMATION", name: "自動化工作流" },
  { code: "TEST_QA", name: "測試/品質" },
  { code: "TRAINING", name: "教材/課程/內訓" },
  { code: "RESEARCH", name: "研究/選型/技術探索" },
  { code: "OTHER", name: "其他" }
];

const STAGE_OPTIONS = [
  { code: "ACTIVE", name: "進行中" },
  { code: "PAUSED", name: "暫停" },
  { code: "ARCHIVED", name: "已封存" }
];

const PLATFORM_OPTIONS = [
  { code: "CHATGPT", name: "ChatGPT" },
  { code: "GEMINI", name: "Gemini" },
  { code: "CLAUDE", name: "Claude" },
  { code: "COPILOT", name: "GitHub Copilot" },
  { code: "CODEX", name: "Codex" },
  { code: "N8N", name: "n8n" },
  { code: "POWER_PLATFORM", name: "Power Platform" }
];

const DELIVERABLE_OPTIONS = [
  { code: "MD", name: "Markdown" },
  { code: "PPTX", name: "PPT" },
  { code: "PDF", name: "PDF" },
  { code: "MERMAID", name: "Mermaid/流程圖" },
  { code: "JSON", name: "JSON" },
  { code: "XLSX", name: "Excel" },
  { code: "CODE", name: "程式碼/腳本" },
  { code: "SCRIPT", name: "逐字稿/講稿" }
];

const AUDIENCE_OPTIONS = [
  { code: "CLIENT", name: "對客戶" },
  { code: "MANAGER", name: "對主管" },
  { code: "INTERNAL", name: "內部" },
  { code: "TRAINING", name: "教育訓練" }
];

const COMMON_TAG_OPTIONS = [
  { code: "REUSABLE", name: "可重用" },
  { code: "NEED_CONFIRM", name: "待確認" },
  { code: "DECISION", name: "決策" },
  { code: "BLOCKED", name: "卡關" },
  { code: "GOOD_RESULT", name: "效果佳" },
  { code: "NEED_REWORK", name: "需重作" },
  { code: "SENSITIVE", name: "敏感資訊" }
];

function labelFromOptions(value: string, options: Array<{ code: string; name: string }>) {
  const found = options.find((o) => o.code.toLowerCase() === value.toLowerCase());
  return found?.name ?? value;
}

function uniq(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function toggle(list: string[], item: string) {
  const has = list.some((x) => x.toLowerCase() === item.toLowerCase());
  if (has) return list.filter((x) => x.toLowerCase() !== item.toLowerCase());
  return uniq([...list, item]);
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={
        "pm-chip text-[11px] " +
        (active
          ? ""
          : "pm-chip-neutral")
      }
      style={
        active
          ? {
              background: "rgba(47, 111, 111, 0.16)",
              color: "var(--pm-brand-strong)",
              borderColor: "rgba(47, 111, 111, 0.55)",
              boxShadow: "inset 0 0 0 1px rgba(47, 111, 111, 0.2)"
            }
          : undefined
      }
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function ProjectMeta({ project }: { project: Project | null }) {
  const [meta, setMeta] = useState<ProjectMeta>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(() => (project?.id ? `/api/projects/${project.id}/meta` : null), [project?.id]);

  const load = async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const data = (await res.json()) as ProjectMeta;
      if (!res.ok) throw new Error((data as any)?.message ?? "無法載入專案標籤");
      setMeta(data ?? {});
    } catch (err) {
      setMeta({});
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!endpoint) {
      setMeta({});
      setError(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const handleSave = async () => {
    if (!endpoint) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta)
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(payload?.message ?? "儲存失敗");
      setMeta(payload as ProjectMeta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const setList = (key: "platforms" | "deliverables" | "audiences" | "commonTags", value: string[]) => {
    setMeta((m) => ({ ...m, [key]: value }));
  };

  const platforms = meta.platforms ?? [];
  const deliverables = meta.deliverables ?? [];
  const audiences = meta.audiences ?? [];
  const commonTags = meta.commonTags ?? [];

  return (
    <div className="pm-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">分類與標籤</div>
          <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
            只影響此專案（存於專案資料夾 `_meta.json`）。
          </div>
        </div>
        <button
          type="button"
          className="pm-btn pm-btn-primary h-9 px-4 text-sm disabled:opacity-60"
          disabled={!project?.id || saving}
          onClick={() => void handleSave()}
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>

      {error ? (
        <div className="mt-2 text-[11px]" style={{ color: "var(--pm-danger)" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-2 text-[11px]" style={{ color: "var(--pm-muted)" }}>
          載入中…
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
              專案類型
            </div>
            <select
              className="pm-select h-9 !text-sm"
              value={meta.category ?? ""}
              disabled={!project?.id}
              onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value || undefined }))}
            >
              <option value="">未設定</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
              狀態（Prototype taxonomy）
            </div>
            <select
              className="pm-select h-9 !text-sm"
              value={meta.stage ?? ""}
              disabled={!project?.id}
              onChange={(e) => setMeta((m) => ({ ...m, stage: e.target.value || undefined }))}
            >
              <option value="">未設定</option>
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {meta.category || meta.stage || platforms.length || deliverables.length || audiences.length || commonTags.length ? (
          <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
            <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
              快速摘要
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {meta.category ? <Chip active={true}>{labelFromOptions(meta.category, CATEGORY_OPTIONS)}</Chip> : null}
              {meta.stage ? <Chip active={true}>{labelFromOptions(meta.stage, STAGE_OPTIONS)}</Chip> : null}
              {platforms.map((x) => (
                <Chip key={`p-${x}`} active={true}>
                  {labelFromOptions(x, PLATFORM_OPTIONS)}
                </Chip>
              ))}
              {deliverables.map((x) => (
                <Chip key={`d-${x}`} active={true}>
                  {labelFromOptions(x, DELIVERABLE_OPTIONS)}
                </Chip>
              ))}
              {audiences.map((x) => (
                <Chip key={`a-${x}`} active={true}>
                  {labelFromOptions(x, AUDIENCE_OPTIONS)}
                </Chip>
              ))}
              {commonTags.map((x) => (
                <Chip key={`t-${x}`} active={true}>
                  {labelFromOptions(x, COMMON_TAG_OPTIONS)}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
            平台標籤
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((opt) => (
              <Chip
                key={opt.code}
                active={platforms.some((x) => x.toLowerCase() === opt.code.toLowerCase())}
                onClick={() => setList("platforms", toggle(platforms, opt.code))}
              >
                {opt.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
            交付物標籤
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {DELIVERABLE_OPTIONS.map((opt) => (
              <Chip
                key={opt.code}
                active={deliverables.some((x) => x.toLowerCase() === opt.code.toLowerCase())}
                onClick={() => setList("deliverables", toggle(deliverables, opt.code))}
              >
                {opt.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
            受眾標籤
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <Chip
                key={opt.code}
                active={audiences.some((x) => x.toLowerCase() === opt.code.toLowerCase())}
                onClick={() => setList("audiences", toggle(audiences, opt.code))}
              >
                {opt.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="pm-card" style={{ background: "var(--pm-panel-ink)" }}>
          <div className="text-[11px] font-semibold" style={{ color: "var(--pm-muted)" }}>
            共通標籤
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_TAG_OPTIONS.map((opt) => (
              <Chip
                key={opt.code}
                active={commonTags.some((x) => x.toLowerCase() === opt.code.toLowerCase())}
                onClick={() => setList("commonTags", toggle(commonTags, opt.code))}
              >
                {opt.name}
              </Chip>
            ))}
          </div>
        </div>

        {meta.updatedAt ? (
          <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
            上次儲存：{meta.updatedAt}
          </div>
        ) : null}
      </div>
    </div>
  );
}
