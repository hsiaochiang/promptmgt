"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import clsx from "clsx";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const safeContent = content?.trim().length ? content : "_尚無內容_";

  return (
    <div
      className={clsx(
        "prose prose-slate max-w-none break-words prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-pre:rounded prose-pre:p-3 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
