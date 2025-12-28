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
        "prose pm-prose max-w-none break-words prose-pre:p-4",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
