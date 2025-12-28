"use client";

import React, { useEffect } from "react";
import { buildFullContent, buildSlimContent } from "@/lib/utils/clipboard";
import { formatForUI_HHmm } from "@/lib/utils/date";
import type { PromptFrontmatter } from "@/lib/types/schema";

interface Props {
  title: string;
  frontmatter: PromptFrontmatter | null;
  body: string | null;
  onToggleFocus?: () => void;
}

export default function PromptHeader({ title, frontmatter, body, onToggleFocus }: Props) {
  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);

  const handleCopyFull = async () => {
    if (!frontmatter || !body) return;
    await navigator.clipboard.writeText(buildFullContent(frontmatter, body));
    setCopyMessage("已複製完整提示詞");
  };

  const handleCopySlim = async () => {
    if (!body || !frontmatter) return;
    await navigator.clipboard.writeText(buildSlimContent(buildFullContent(frontmatter, body)));
    setCopyMessage("已複製精簡版本");
  };

  useEffect(() => {
    if (!copyMessage) return;
    const timer = window.setTimeout(() => setCopyMessage(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copyMessage]);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!frontmatter || !body) return;
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        await handleCopySlim();
      } else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "c") {
        // 完整複製與一般 Ctrl+C 行為相同，僅在已聚焦本頁時攔截
        if (document.activeElement && document.activeElement.tagName === "BODY") {
          e.preventDefault();
          await handleCopyFull();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [frontmatter, body]);

  return (
    <div className="pm-panel-header px-4 py-3 space-y-2 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] mb-0.5" style={{ color: "var(--pm-muted)" }}>
            目前編輯中
          </div>
          <div className="text-xs font-semibold truncate max-w-[260px]" style={{ color: "var(--pm-text)" }}>
            {title}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px]">
          <div className="flex gap-1">
            <button
              onClick={handleCopyFull}
              className="pm-btn h-7 px-3 text-[10px]"
            >
              複製完整提示詞
            </button>
            <button
              onClick={handleCopySlim}
              className="pm-btn h-7 px-3 text-[10px]"
            >
              複製給模型用
            </button>
            {onToggleFocus ? (
              <button
                onClick={onToggleFocus}
                className="pm-btn h-7 px-3 text-[10px]"
              >
                專注模式
              </button>
            ) : null}
          </div>
          <div className="flex gap-1" style={{ color: "var(--pm-muted)" }}>
            <span>Ctrl + C 完整</span>
            <span>Ctrl + Shift + C 精簡</span>
          </div>
          {frontmatter?.updatedAt ? (
            <div className="text-[10px]" style={{ color: "var(--pm-muted)" }}>
              最後儲存：{formatForUI_HHmm(frontmatter.updatedAt)}
            </div>
          ) : null}
        </div>
      </div>
      {frontmatter && (
        <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--pm-muted)" }}>
          <span className="pm-badge text-[10px]">狀態：{frontmatter.status}</span>
          <span className="pm-badge text-[10px]">模型：{frontmatter.model}</span>
          <span className="pm-badge pm-badge-brand text-[10px]">所屬專案：{frontmatter.project}</span>
        </div>
      )}
      {copyMessage ? (
        <div className="text-[10px]" style={{ color: "var(--pm-brand-strong)" }}>
          {copyMessage}
        </div>
      ) : null}
    </div>
  );
}
