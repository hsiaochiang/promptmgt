"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Settings } from "@/lib/types/schema";

export default function RootPathAlert() {
  const [rootPath, setRootPath] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/settings");
      const data = (await res.json()) as Settings;
      setRootPath(data.rootPath);
    };
    load();
  }, []);

  if (rootPath) return null;

  return (
    <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-2 text-xs rounded-md flex items-center justify-between gap-3">
      <span>未設定根路徑，請在設定頁設定 Prompts 根資料夾，否則無法列出提示詞。</span>
      <Link
        href="/settings"
        className="px-2 py-1 rounded-full border border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
      >
        前往設定
      </Link>
    </div>
  );
}
