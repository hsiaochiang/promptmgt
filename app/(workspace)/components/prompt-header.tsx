"use client";

import { buildFullContent, buildSlimContent } from "@/lib/utils/clipboard";
import type { PromptFrontmatter } from "@/lib/types/schema";

interface Props {
  title: string;
  frontmatter: PromptFrontmatter | null;
  body: string | null;
}

export default function PromptHeader({ title, frontmatter, body }: Props) {
  const handleCopyFull = async () => {
    if (!frontmatter || !body) return;
    await navigator.clipboard.writeText(buildFullContent(frontmatter, body));
  };

  const handleCopySlim = async () => {
    if (!body || !frontmatter) return;
    await navigator.clipboard.writeText(buildSlimContent(buildFullContent(frontmatter, body)));
  };

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-500 mb-0.5">目前編輯中</div>
          <div className="text-xs font-semibold text-slate-900 truncate max-w-[260px]">{title}</div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px]">
          <div className="flex gap-1">
            <button
              onClick={handleCopyFull}
              className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100"
            >
              複製完整提示詞
            </button>
            <button
              onClick={handleCopySlim}
              className="px-2 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-100"
            >
              複製給模型用
            </button>
          </div>
          <div className="flex gap-1 text-slate-400">
            <span>Ctrl + C 完整</span>
            <span>Alt + C 精簡</span>
          </div>
        </div>
      </div>
      {frontmatter && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="px-2 py-0.5 rounded-full bg-slate-100">狀態：{frontmatter.status}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100">模型：{frontmatter.model}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100">
            所屬專案：{frontmatter.project}
          </span>
        </div>
      )}
    </div>
  );
}
