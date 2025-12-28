"use client";

import React, { useEffect, useState } from "react";
import type { Settings } from "@/lib/types/schema";
import { toIsoWithOffset } from "@/lib/utils/date";

const FLAGS_STORAGE_KEY = "pm-settings-flags";
const baseDefaults: Settings = {
  rootPath: "",
  pinned: true,
  layout: {},
  fontScale: 2,
  telemetryEnabled: true,
  updateCheckEnabled: true,
  telemetry: { enabled: true },
  logPath: "",
  createdAt: toIsoWithOffset(),
  updatedAt: toIsoWithOffset()
};

function persistFlags(next: Partial<Settings>) {
  if (typeof window === "undefined") return;
  const payload = {
    telemetryEnabled: next.telemetryEnabled,
    updateCheckEnabled: next.updateCheckEnabled
  };
  window.localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(payload));
}

function readFlagDefaults(): Settings | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(FLAGS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...baseDefaults,
      telemetryEnabled: parsed.telemetryEnabled ?? baseDefaults.telemetryEnabled,
      updateCheckEnabled: parsed.updateCheckEnabled ?? baseDefaults.updateCheckEnabled
    } as Settings;
  } catch {
    window.localStorage.removeItem(FLAGS_STORAGE_KEY);
    return null;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(() => readFlagDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootPathInput, setRootPathInput] = useState("");
  const [logPathInput, setLogPathInput] = useState("");
  const [pathExists, setPathExists] = useState<boolean | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateChecking, setUpdateChecking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as any)?.message ?? "讀取設定失敗");
      }
      const data = body as Settings;
      setSettings(data);
      setRootPathInput(data.rootPath ?? "");
      setLogPathInput((data as any).logPath ?? "");
      setPathExists((data as any).pathExists ?? null);
      persistFlags(data);
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? "更新設定失敗");
      }
      const data = body as Settings;
      setSettings(data);
      setRootPathInput(data.rootPath ?? "");
      setLogPathInput((data as any).logPath ?? "");
      setPathExists((data as any).pathExists ?? null);
      persistFlags(data);
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

  const checkUpdate = async () => {
    setUpdateChecking(true);
    setUpdateStatus("");
    try {
      const res = await fetch("/api/settings/update-check");
      const data = await res.json();
      if (data.status === "update-available") {
        setUpdateStatus(`有新版本：${data.latestVersion ?? "unknown"}`);
      } else if (data.status === "up-to-date") {
        setUpdateStatus("已是最新版本");
      } else if (data.status === "skipped") {
        setUpdateStatus(data.reason === "disabled" ? "已停用更新檢查" : "已略過（非安全端點/未設定）");
      } else {
        setUpdateStatus(`檢查失敗：${data.reason ?? "未知原因"}`);
      }
    } catch (err) {
      setUpdateStatus(err instanceof Error ? `檢查失敗：${err.message}` : "檢查失敗");
    } finally {
      setUpdateChecking(false);
    }
  };

  return (
    <main className="min-h-screen theme-prototype">
      <div className="pm-app">
        <div className="pm-panel max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">設定</h1>
            <p className="text-sm" style={{ color: "var(--pm-muted)" }}>
              遙測與更新檢查可隨時開關，預設開啟。
            </p>
          </div>
          {saving && (
            <span className="text-xs" style={{ color: "var(--pm-muted)" }}>
              儲存中…
            </span>
          )}
        </div>

        {error && (
          <div className="text-sm rounded-[14px] px-3 py-2" style={{ color: "var(--pm-danger)", background: "rgba(217,95,95,0.08)", border: "1px solid rgba(217,95,95,0.25)" }}>
            {error}
          </div>
        )}

        {loading || !settings ? (
          <div className="text-sm" style={{ color: "var(--pm-muted)" }}>
            載入設定中…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-[14px] space-y-2" style={{ border: "1px solid var(--pm-border)", background: "var(--pm-panel-ink)" }}>
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
                  className="flex-1 rounded-full border bg-[color:var(--pm-panel)] px-4 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--pm-border)" }}
                  value={rootPathInput}
                  onChange={(e) => setRootPathInput(e.target.value)}
                  placeholder="例如：C:\\Users\\me\\Prompts"
                />
                <button
                  onClick={() => update({ rootPath: rootPathInput })}
                  className="pm-btn pm-btn-primary px-4 py-2 text-sm"
                >
                  儲存路徑
                </button>
                <button
                  onClick={() => update({ rootPath: rootPathInput })}
                  className="pm-btn px-4 py-2 text-sm disabled:opacity-60"
                  disabled={!rootPathInput}
                >
                  建立資料夾
                </button>
                <button
                  onClick={load}
                  className="pm-btn px-4 py-2 text-sm"
                >
                  重新檢查
                </button>
              </div>
              {pathExists === true && rootPathInput ? (
                <div className="text-[11px] text-emerald-700">路徑可用：{rootPathInput}</div>
              ) : null}
            </div>
            <div className="p-4 rounded-[14px] space-y-2" style={{ border: "1px solid var(--pm-border)", background: "var(--pm-panel-ink)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">日誌路徑</div>
                  <div className="text-sm text-slate-500">結構化 JSON 日誌（5MB 旋轉、遮蔽敏感欄位）。預設 rootPath/logs/app.log。</div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-[11px] text-slate-400">{saving ? "儲存中…" : null}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-full border bg-[color:var(--pm-panel)] px-4 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--pm-border)" }}
                  value={logPathInput}
                  onChange={(e) => setLogPathInput(e.target.value)}
                  placeholder="例如：C:\\Users\\me\\AppData\\Local\\promptmgt\\logs\\app.log"
                />
                <button
                  onClick={() => update({ logPath: logPathInput })}
                  className="pm-btn pm-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                  disabled={!logPathInput}
                >
                  儲存日誌路徑
                </button>
              </div>
              <div className="text-[11px]" style={{ color: "var(--pm-muted)" }}>
                預設值：{settings?.rootPath ? `${settings.rootPath}\\logs\\app.log` : "rootPath/logs/app.log"}
              </div>
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
            <div className="p-4 rounded-[14px] space-y-2" style={{ border: "1px solid var(--pm-border)", background: "var(--pm-panel-ink)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">手動檢查更新</div>
                  <div className="text-sm text-slate-500">透過設定的安全端點檢查最新版本；若已停用將直接略過。</div>
                </div>
                <button
                  onClick={checkUpdate}
                  disabled={updateChecking}
                  className="pm-btn px-4 py-2 text-sm disabled:opacity-60"
                >
                  {updateChecking ? "檢查中…" : "立即檢查"}
                </button>
              </div>
              {updateStatus ? <div className="text-sm" style={{ color: "var(--pm-muted)" }}>{updateStatus}</div> : null}
            </div>
          </div>
        )}
        </div>
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
