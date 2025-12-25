"use client";

import React from "react";
import { Prompt } from "../providers/mock-app";
import { TagPicker } from "./tag-picker";

export function PromptEditor({
  prompt,
  onChange,
  onCopy,
  onArchive,
  onMove,
  projectOptions
}: {
  prompt: Prompt;
  onChange: (patch: Partial<Prompt>) => void;
  onCopy: (text: string) => void;
  onArchive?: () => void;
  onMove?: (projectId: string) => void;
  projectOptions?: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4" data-testid="prompt-editor">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <input
            value={prompt.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full h-11 px-3 rounded-lg border bg-white text-lg font-semibold"
            placeholder="標題"
          />
          <div className="text-xs text-slate-500">狀態：{prompt.status}</div>
        </div>
        <div className="flex items-center gap-2">
          {onMove && projectOptions ? (
            <select
              value={prompt.projectId}
              onChange={(e) => onMove(e.target.value)}
              className="h-10 px-3 rounded-lg border bg-white text-sm"
              aria-label="移動至專案"
            >
              {projectOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="h-10 px-3 rounded-lg border bg-white text-sm"
            onClick={() => onCopy(prompt.body)}
            aria-label="複製提示詞"
          >
            複製
          </button>
          {onArchive ? (
            <button
              type="button"
              className="h-10 px-3 rounded-lg border bg-amber-500 text-white text-sm"
              onClick={onArchive}
            >
              歸檔
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold mb-1">正文</div>
        <textarea
          value={prompt.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className="w-full min-h-[220px] rounded-2xl border bg-white p-3 text-sm"
          placeholder="撰寫提示詞內容"
        />
      </div>

      <div>
        <div className="text-sm font-semibold mb-1">標籤</div>
        <TagPicker tags={prompt.tags} onAdd={(tag) => onChange({ tags: Array.from(new Set([...prompt.tags, tag.trim()].filter(Boolean))) })} onRemove={(tag) => onChange({ tags: prompt.tags.filter((t) => t !== tag) })} />
      </div>
    </div>
  );
}
