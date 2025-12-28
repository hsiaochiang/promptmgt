"use client";

import React from "react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  localDate?: Date | number | null;
  externalDate?: Date | number | null;
  diffContent?: string | null;
  isBusy?: boolean;
  onLoadExternal: () => void;
  onKeepLocal: () => void;
  onViewDiff: () => void;
}

export default function ConflictDialog({
  open,
  localDate,
  externalDate,
  diffContent,
  isBusy,
  onLoadExternal,
  onKeepLocal,
  onViewDiff
}: Props) {
  if (!open) return null;

  const formatDate = (d?: Date | number | null) => {
    if (!d) return "未知";
    return format(new Date(d), "yyyy-MM-dd HH:mm:ss");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div className="w-full max-w-lg pm-panel overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div
          className="px-5 py-4 flex items-start gap-3"
          style={{ background: "rgba(212, 163, 115, 0.18)", borderBottom: "1px solid rgba(212, 163, 115, 0.35)" }}
        >
          <div className="text-2xl" style={{ color: "#8a5a2a" }}>
            ⚠️
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#5a3b1f" }}>
              偵測到檔案衝突
            </h3>
            <p className="text-sm mt-1" style={{ color: "#8a5a2a" }}>
              此提示詞在磁碟上已被修改。您希望如何處理？
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="pm-card">
              <div className="font-medium mb-1" style={{ color: "var(--pm-text)" }}>
                您的版本 (編輯中)
              </div>
              <div className="text-xs" style={{ color: "var(--pm-muted)" }}>
                {formatDate(localDate)}
              </div>
            </div>
            <div
              className="pm-card"
              style={{ borderColor: "rgba(212, 163, 115, 0.45)", background: "rgba(212, 163, 115, 0.12)" }}
            >
              <div className="font-medium mb-1" style={{ color: "#5a3b1f" }}>
                外部版本 (磁碟)
              </div>
              <div className="text-xs" style={{ color: "#8a5a2a" }}>
                {formatDate(externalDate)}
              </div>
            </div>
          </div>

          {diffContent && (
            <div className="mt-2">
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--pm-muted)" }}>
                外部內容預覽：
              </div>
              <div
                className="text-[11px] rounded p-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono"
                style={{ color: "var(--pm-text)", background: "var(--pm-panel-ink)", border: "1px solid var(--pm-border)" }}
              >
                {diffContent}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 pm-panel-header flex items-center justify-end gap-3">
          <button
            onClick={onViewDiff}
            disabled={isBusy}
            className="pm-btn h-9 px-4 text-sm disabled:opacity-50"
          >
            {diffContent ? "隱藏差異" : "檢視差異"}
          </button>
          <button
            onClick={onKeepLocal}
            disabled={isBusy}
            className="pm-btn pm-btn-primary h-9 px-4 text-sm disabled:opacity-50"
          >
            強制覆寫（保留本地）
          </button>
          <button
            onClick={onLoadExternal}
            disabled={isBusy}
            className="pm-btn pm-btn-accent h-9 px-4 text-sm disabled:opacity-50"
          >
            重新載入外部版本
          </button>
        </div>
      </div>
    </div>
  );
}
