"use client";

import React, { useEffect, useState } from "react";
import type { Settings } from "@/lib/types/schema";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootPathInput, setRootPathInput] = useState("");
  const [pathExists, setPathExists] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const data = (await res.json()) as Settings;
      setSettings(data);
      setRootPathInput(data.rootPath ?? "");
      setPathExists((data as any).pathExists ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取設定失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (partial: Partial<Settings>) => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, ...partial })
      });
      const data = (await res.json()) as Settings;
      setSettings(data);
      setRootPathInput(data.rootPath ?? "");
      setPathExists((data as any).pathExists ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新設定失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Settings) => {
    if (!settings) return;
    update({ [key]: !settings[key] } as Partial<Settings>);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">設定</h1>
            <p className="text-sm text-slate-500">遙測與更新檢查可隨時開關，預設開啟。</p>
          </div>
          {saving && <span className="text-xs text-slate-500">儲存中…</span>}
        </div>

        {error && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {loading || !settings ? (
          <div className="text-sm text-slate-500">載入設定中…</div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">根路徑</div>
                  <div className="text-sm text-slate-500">指定 Prompts 儲存資料夾的絕對路徑。</div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  {pathExists === false ? (
                    <span className="text-amber-700">路徑不存在，請建立或重新定位</span>
                  ) : null}
                  <span className="text-[11px] text-slate-400">{saving ? "儲存中…" : null}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  value={rootPathInput}
                  onChange={(e) => setRootPathInput(e.target.value)}
                  placeholder="例如：C:\\Users\\me\\Prompts"
                />
                <button
                  onClick={() => update({ rootPath: rootPathInput })}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                >
                  儲存路徑
                </button>
                <button
                  onClick={() => update({ rootPath: rootPathInput })}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                  disabled={!rootPathInput}
                >
                  建立資料夾
                </button>
                <button
                  onClick={load}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                >
                  重新檢查
                </button>
              </div>
              {pathExists === true && rootPathInput ? (
                <div className="text-[11px] text-emerald-700">路徑可用：{rootPathInput}</div>
              ) : null}
            </div>
            <ToggleRow
              title="匿名遙測"
              description="用於彙總啟動/效能/錯誤代碼，不含提示詞內容或檔名。"
              checked={settings.telemetryEnabled}
              onToggle={() => toggle("telemetryEnabled")}
            />
            <ToggleRow
              title="更新檢查"
              description="啟動時及每日檢查更新，可關閉以避免對外連線。"
              checked={settings.updateCheckEnabled}
              onToggle={() => toggle("updateCheckEnabled")}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-lg">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      <button
        onClick={onToggle}
        className={
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
          (checked ? "bg-slate-900" : "bg-slate-300")
        }
        aria-pressed={checked}
        type="button"
      >
        <span
          className={
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform " +
            (checked ? "translate-x-5" : "translate-x-1")
          }
        />
      </button>
    </div>
  );
}
