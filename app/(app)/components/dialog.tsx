"use client";

import React from "react";

type DialogProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Dialog({ title, open, onClose, children, footer }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">{title}</div>
            <button type="button" className="text-slate-500" onClick={onClose} aria-label="關閉">
              ✕
            </button>
          </div>
          <div className="p-4 space-y-3 text-sm text-slate-800">{children}</div>
          {footer ? <div className="px-4 py-3 border-t bg-slate-50">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
