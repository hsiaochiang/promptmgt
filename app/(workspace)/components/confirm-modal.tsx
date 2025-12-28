"use client";

import React, { useEffect, useId, useRef } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const initialTarget = cancelRef.current ?? confirmRef.current;
    initialTarget?.focus({ preventScroll: true });

    return () => {
      previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button,[href],[tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => !node.hasAttribute("disabled"));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl shadow-xl w-[360px] max-w-[90%] p-4 space-y-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
      >
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900" id={titleId}>
            {title}
          </div>
          <div className="text-xs text-slate-600" id={descriptionId}>
            {description}
          </div>
        </div>
        <div className="flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50"
            data-testid="confirm-cancel"
            ref={cancelRef}
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
            ref={confirmRef}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
