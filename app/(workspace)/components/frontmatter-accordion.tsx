"use client";

import React, { useMemo, useState } from "react";
import type { PromptFrontmatter, PromptStatus, PromptType } from "@/lib/types/schema";
import { commonTags } from "@/lib/taxonomy/data";
import { normalizeTaxonomyArray, toTaxonomyTable } from "@/lib/utils/taxonomy";

const commonTagTable = toTaxonomyTable(commonTags);

interface Props {
  frontmatter: PromptFrontmatter | null;
  onChange: (partial: Partial<PromptFrontmatter>) => void;
  onDelete?: () => void;
}

export default function FrontmatterAccordion({ frontmatter, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState(() => (frontmatter?.tags ?? []).map((t) => t.code).join(", "));

  const summary = useMemo(() => {
    if (!frontmatter) return "尚未選擇提示詞";
    const parts = [frontmatter.status, frontmatter.model, frontmatter.project]
      .filter(Boolean)
      .map((p) => `${p}`);
    const tags = (frontmatter.tags ?? []).slice(0, 3).map((t) => `#${t.code}`);
    return [...parts, ...tags].join(" · ") || "前言資訊";
  }, [frontmatter]);

  if (!frontmatter) return null;

  return (
    <div
      className="border border-slate-200 bg-white rounded-lg p-3 text-[12px] space-y-2"
      data-testid="frontmatter-accordion"
      data-open={open}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100 text-[11px]"
            aria-expanded={open}
          >
            {open ? "收合前言" : "展開前言"}
          </button>
          <span className="text-slate-500 text-[11px] truncate" title={summary}>
            {summary}
          </span>
        </div>
        {onDelete ? (
          <button
            onClick={onDelete}
            className="px-3 py-1 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-[11px]"
          >
            刪除提示詞
          </button>
        ) : null}
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-2" data-testid="frontmatter-form">
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">標題</div>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={frontmatter.title}
              onChange={(e) =>
                onChange({ title: e.target.value, updatedAt: new Date().toISOString() })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">模型</div>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={frontmatter.model}
              onChange={(e) =>
                onChange({ model: e.target.value, updatedAt: new Date().toISOString() })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">狀態</div>
            <select
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={frontmatter.status}
              onChange={(e) =>
                onChange({ status: e.target.value as PromptStatus, updatedAt: new Date().toISOString() })
              }
            >
              <option value="使用中">使用中</option>
              <option value="草稿">草稿</option>
              <option value="已封存">已封存</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500">類型</div>
            <select
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={frontmatter.type}
              onChange={(e) =>
                onChange({ type: e.target.value as PromptType, updatedAt: new Date().toISOString() })
              }
            >
              <option value="簡報生成">簡報生成</option>
              <option value="結構設計">結構設計</option>
              <option value="RAG 調教">RAG 調教</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="col-span-2 space-y-1">
            <div className="text-[11px] text-slate-500">標籤（以逗號分隔）</div>
            <input
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={tagsInput}
              onChange={(e) => {
                const value = e.target.value;
                setTagsInput(value);
                const raw = value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                const tags = normalizeTaxonomyArray(raw, commonTagTable);
                onChange({ tags, updatedAt: new Date().toISOString() });
              }}
            />
          </div>
          <div className="col-span-2 space-y-1">
            <div className="text-[11px] text-slate-500">備註</div>
            <textarea
              className="w-full border border-slate-300 rounded px-2 py-1"
              value={frontmatter.note ?? ""}
              onChange={(e) =>
                onChange({ note: e.target.value, updatedAt: new Date().toISOString() })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
