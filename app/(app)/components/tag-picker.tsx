"use client";

import React, { useState } from "react";

export function TagPicker({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (tag: string) => void; onRemove: (tag: string) => void }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full border bg-slate-50 px-3 py-1 text-sm">
            <span>{tag}</span>
            <button type="button" className="text-slate-500" onClick={() => onRemove(tag)} aria-label={`移除 ${tag}`}>
              ✕
            </button>
          </span>
        ))}
        {!tags.length ? <span className="text-sm text-slate-500">尚無標籤</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd(draft);
              setDraft("");
              e.preventDefault();
            }
          }}
          placeholder="新增標籤後按 Enter"
          className="h-10 px-3 rounded-lg border bg-white text-sm flex-1"
        />
        <button
          type="button"
          className="h-10 px-3 rounded-lg border bg-slate-900 text-white text-sm"
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          新增
        </button>
      </div>
    </div>
  );
}
