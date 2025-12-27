"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Settings } from "@/lib/types/schema";

interface RootPathAlertProps {
  className?: string;
}

export default function RootPathAlert({ className }: RootPathAlertProps) {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [pathExists, setPathExists] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = (await res.json()) as Settings;
      setRootPath(data.rootPath ?? null);
      setPathExists(Boolean((data as any).pathExists ?? data.rootPath));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const ensureFolder = async () => {
    if (!rootPath) return;
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootPath })
      });
      const data = (await res.json()) as Settings;
      setRootPath(data.rootPath ?? null);
      setPathExists(Boolean((data as any).pathExists ?? data.rootPath));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;
  if (rootPath && pathExists) return null;

  const message = !rootPath
    ? "未設定根路徑，請在設定頁設定 Prompts 根資料夾，否則無法列出提示詞。"
    : "根路徑已失效或無法存取，請重新定位或建立資料夾後再試。";

  return (
    <div
      className={clsx(
        "bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 text-xs rounded-md flex items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span>{message}</span>
        {rootPath ? <span className="text-[11px] text-amber-700">目前設定：{rootPath}</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={refresh}
          className="px-2 py-1 rounded-full border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
        >
          重新整理
        </button>
        {rootPath ? (
          <button
            type="button"
            onClick={ensureFolder}
            disabled={busy}
            className="px-2 py-1 rounded-full border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-60"
          >
            建立資料夾
          </button>
        ) : (
          <Link
            href="/settings"
            className="px-2 py-1 rounded-full border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
          >
            前往設定
          </Link>
        )}
      </div>
    </div>
  );
}
