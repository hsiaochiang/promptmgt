"use client";

import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center" role="dialog" aria-modal="true" aria-label="操作指引">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} onClick={onClose} />
      <div
        className="relative w-[min(720px,90vw)] rounded-[20px] border p-5"
        style={{ background: "var(--pm-panel)", borderColor: "var(--pm-border)", boxShadow: "var(--pm-shadow)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-bold" style={{ color: "var(--pm-text)" }}>
            操作指引
          </div>
          <button type="button" className="pm-btn h-9 px-4 text-sm" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="pm-card">
            <div className="font-semibold mb-1">新增提示詞</div>
            <div className="text-sm" style={{ color: "var(--pm-muted)" }}>
              從列表或頂部按鈕建立，直接進入編輯；儲存後可返回列表。
            </div>
          </div>
          <div className="pm-card">
            <div className="font-semibold mb-1">專案 → 提示詞</div>
            <div className="text-sm" style={{ color: "var(--pm-muted)" }}>
              在專案中選取提示詞，右側資料欄會同步顯示摘要與快捷操作。
            </div>
          </div>
          <div className="pm-card">
            <div className="font-semibold mb-1">剪貼簿整理</div>
            <div className="text-sm" style={{ color: "var(--pm-muted)" }}>
              把臨時內容整理後另存為提示詞，保留原始內容以便回溯。
            </div>
          </div>
          <div className="pm-card">
            <div className="font-semibold mb-1">安全操作</div>
            <div className="text-sm" style={{ color: "var(--pm-muted)" }}>
              刪除採 5 秒延遲，可透過底部 Undo 立即撤銷。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
