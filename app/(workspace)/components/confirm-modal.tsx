"use client";

import React from "react";
import clsx from "clsx";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = "確認操作",
  description = "是否繼續？",
  confirmText = "刪除",
  cancelText = "取消",
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-[360px] max-w-[90%] p-4 space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600">{description}</div>
        </div>
        <div className="flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
            data-testid="confirm-cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={clsx(
              "px-3 py-1 rounded-full text-white",
              confirmText.includes("刪") ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
            )}
            data-testid="confirm-accept"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
