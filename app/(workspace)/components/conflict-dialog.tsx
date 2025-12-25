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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900">偵測到檔案衝突</h3>
            <p className="text-sm text-amber-700 mt-1">
              此提示詞在磁碟上已被修改。您希望如何處理？
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <div className="font-medium text-slate-700 mb-1">您的版本 (編輯中)</div>
              <div className="text-slate-500 text-xs">{formatDate(localDate)}</div>
            </div>
            <div className="p-3 bg-amber-50/50 rounded border border-amber-200">
              <div className="font-medium text-amber-800 mb-1">外部版本 (磁碟)</div>
              <div className="text-amber-600 text-xs">{formatDate(externalDate)}</div>
            </div>
          </div>

          {diffContent && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-slate-500 mb-1">外部內容預覽：</div>
              <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-3 max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                {diffContent}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onViewDiff}
            disabled={isBusy}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
          >
            {diffContent ? "隱藏差異" : "檢視差異"}
          </button>
          <button
            onClick={onKeepLocal}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            保留本地 (覆寫)
          </button>
          <button
            onClick={onLoadExternal}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm transition-colors disabled:opacity-50"
          >
            載入外部變更
          </button>
        </div>
      </div>
    </div>
  );
}
