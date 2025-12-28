"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types/schema";
import {
  AUDIENCE_OPTIONS,
  CATEGORY_OPTIONS,
  COMMON_TAG_OPTIONS,
  DELIVERABLE_OPTIONS,
  PLATFORM_OPTIONS,
  STAGE_OPTIONS,
  labelFromOptions,
  type ProjectMetaTaxonomyOption
} from "@/lib/ui/projectMetaTaxonomy";

type ProjectMeta = {
  category?: string;
  stage?: string;
  platforms?: string[];
  deliverables?: string[];
  audiences?: string[];
  commonTags?: string[];
  updatedAt?: string;
};

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

function removeFromList(list: string[], item: string) {
  return list.filter((x) => x.toLowerCase() !== item.toLowerCase());
}

function resolveToOptionCodeOrRaw(input: string, options: ProjectMetaTaxonomyOption[]) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  const byCode = options.find((o) => o.code.toLowerCase() === lowered);
  if (byCode) return byCode.code;

  const byName = options.find((o) => o.name.toLowerCase() === lowered);
  if (byName) return byName.code;

  return trimmed;
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={
        "pm-chip text-[11px] " + (active ? "" : "pm-chip-neutral")
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

  const [platformDraft, setPlatformDraft] = useState("");
  const [deliverableDraft, setDeliverableDraft] = useState("");
  const [audienceDraft, setAudienceDraft] = useState("");
  const [commonTagDraft, setCommonTagDraft] = useState("");

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

  const addCustomToList = (
    key: "platforms" | "deliverables" | "audiences" | "commonTags",
    raw: string,
    options: ProjectMetaTaxonomyOption[],
    reset: (next: string) => void
  ) => {
    const resolved = resolveToOptionCodeOrRaw(raw, options);
    if (!resolved) return;
    setMeta((m) => {
      const current = (m[key] ?? []) as string[];
      return { ...m, [key]: uniq([...current, resolved]) };
    });
    reset("");
  };

  const platforms = meta.platforms ?? [];
  const deliverables = meta.deliverables ?? [];
  const audiences = meta.audiences ?? [];
  const commonTags = meta.commonTags ?? [];

  const customPlatforms = platforms.filter(
    (x) => !PLATFORM_OPTIONS.some((o) => o.code.toLowerCase() === x.toLowerCase())
  );
  const customDeliverables = deliverables.filter(
    (x) => !DELIVERABLE_OPTIONS.some((o) => o.code.toLowerCase() === x.toLowerCase())
  );
  const customAudiences = audiences.filter(
    (x) => !AUDIENCE_OPTIONS.some((o) => o.code.toLowerCase() === x.toLowerCase())
  );
  const customCommonTags = commonTags.filter(
    (x) => !COMMON_TAG_OPTIONS.some((o) => o.code.toLowerCase() === x.toLowerCase())
  );

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

          <div className="mt-2 flex items-center gap-2">
            <input
              className="pm-input h-9 !text-sm !w-auto flex-1"
              value={platformDraft}
              disabled={!project?.id}
              placeholder="新增自訂平台標籤（Enter 新增）"
              onChange={(e) => setPlatformDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomToList("platforms", platformDraft, PLATFORM_OPTIONS, setPlatformDraft);
                }
                if (e.key === "Escape") setPlatformDraft("");
              }}
            />
            <button
              type="button"
              className="pm-btn h-9 px-4 text-sm disabled:opacity-60"
              disabled={!project?.id}
              onClick={() => addCustomToList("platforms", platformDraft, PLATFORM_OPTIONS, setPlatformDraft)}
            >
              新增
            </button>
            <button
              type="button"
              className="pm-btn h-9 px-3 text-sm disabled:opacity-60"
              disabled={!project?.id || platforms.length === 0}
              onClick={() => setList("platforms", [])}
              title="清空平台標籤"
            >
              清空
            </button>
          </div>

          {customPlatforms.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {customPlatforms.map((x) => (
                <Chip
                  key={`cp-${x}`}
                  active={true}
                  onClick={() => setList("platforms", removeFromList(platforms, x))}
                >
                  <span className="inline-flex items-center gap-1">
                    {x}
                    <span aria-hidden>×</span>
                  </span>
                </Chip>
              ))}
            </div>
          ) : null}

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

          <div className="mt-2 flex items-center gap-2">
            <input
              className="pm-input h-9 !text-sm !w-auto flex-1"
              value={deliverableDraft}
              disabled={!project?.id}
              placeholder="新增自訂交付物標籤（Enter 新增）"
              onChange={(e) => setDeliverableDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomToList("deliverables", deliverableDraft, DELIVERABLE_OPTIONS, setDeliverableDraft);
                }
                if (e.key === "Escape") setDeliverableDraft("");
              }}
            />
            <button
              type="button"
              className="pm-btn h-9 px-4 text-sm disabled:opacity-60"
              disabled={!project?.id}
              onClick={() =>
                addCustomToList("deliverables", deliverableDraft, DELIVERABLE_OPTIONS, setDeliverableDraft)
              }
            >
              新增
            </button>
            <button
              type="button"
              className="pm-btn h-9 px-3 text-sm disabled:opacity-60"
              disabled={!project?.id || deliverables.length === 0}
              onClick={() => setList("deliverables", [])}
              title="清空交付物標籤"
            >
              清空
            </button>
          </div>

          {customDeliverables.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {customDeliverables.map((x) => (
                <Chip
                  key={`cd-${x}`}
                  active={true}
                  onClick={() => setList("deliverables", removeFromList(deliverables, x))}
                >
                  <span className="inline-flex items-center gap-1">
                    {x}
                    <span aria-hidden>×</span>
                  </span>
                </Chip>
              ))}
            </div>
          ) : null}

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

          <div className="mt-2 flex items-center gap-2">
            <input
              className="pm-input h-9 !text-sm !w-auto flex-1"
              value={audienceDraft}
              disabled={!project?.id}
              placeholder="新增自訂受眾標籤（Enter 新增）"
              onChange={(e) => setAudienceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomToList("audiences", audienceDraft, AUDIENCE_OPTIONS, setAudienceDraft);
                }
                if (e.key === "Escape") setAudienceDraft("");
              }}
            />
            <button
              type="button"
              className="pm-btn h-9 px-4 text-sm disabled:opacity-60"
              disabled={!project?.id}
              onClick={() => addCustomToList("audiences", audienceDraft, AUDIENCE_OPTIONS, setAudienceDraft)}
            >
              新增
            </button>
            <button
              type="button"
              className="pm-btn h-9 px-3 text-sm disabled:opacity-60"
              disabled={!project?.id || audiences.length === 0}
              onClick={() => setList("audiences", [])}
              title="清空受眾標籤"
            >
              清空
            </button>
          </div>

          {customAudiences.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {customAudiences.map((x) => (
                <Chip
                  key={`ca-${x}`}
                  active={true}
                  onClick={() => setList("audiences", removeFromList(audiences, x))}
                >
                  <span className="inline-flex items-center gap-1">
                    {x}
                    <span aria-hidden>×</span>
                  </span>
                </Chip>
              ))}
            </div>
          ) : null}

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

          <div className="mt-2 flex items-center gap-2">
            <input
              className="pm-input h-9 !text-sm !w-auto flex-1"
              value={commonTagDraft}
              disabled={!project?.id}
              placeholder="新增自訂共通標籤（Enter 新增）"
              onChange={(e) => setCommonTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomToList("commonTags", commonTagDraft, COMMON_TAG_OPTIONS, setCommonTagDraft);
                }
                if (e.key === "Escape") setCommonTagDraft("");
              }}
            />
            <button
              type="button"
              className="pm-btn h-9 px-4 text-sm disabled:opacity-60"
              disabled={!project?.id}
              onClick={() => addCustomToList("commonTags", commonTagDraft, COMMON_TAG_OPTIONS, setCommonTagDraft)}
            >
              新增
            </button>
            <button
              type="button"
              className="pm-btn h-9 px-3 text-sm disabled:opacity-60"
              disabled={!project?.id || commonTags.length === 0}
              onClick={() => setList("commonTags", [])}
              title="清空共通標籤"
            >
              清空
            </button>
          </div>

          {customCommonTags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {customCommonTags.map((x) => (
                <Chip
                  key={`ct-${x}`}
                  active={true}
                  onClick={() => setList("commonTags", removeFromList(commonTags, x))}
                >
                  <span className="inline-flex items-center gap-1">
                    {x}
                    <span aria-hidden>×</span>
                  </span>
                </Chip>
              ))}
            </div>
          ) : null}

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
