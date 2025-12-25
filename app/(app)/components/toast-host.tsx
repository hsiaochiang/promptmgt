"use client";

import React, { useEffect } from "react";
import { useMockApp } from "../providers/mock-app";

export function ToastHost() {
  const {
    toasts,
    actions: { dismissToast }
  } = useMockApp();

  useEffect(() => {
    const timers = toasts.map((t) => window.setTimeout(() => dismissToast(t.id), 2600));
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, dismissToast]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" data-testid="toast-host">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="min-w-[240px] max-w-[320px] rounded-2xl border bg-white px-4 py-3 shadow-md text-sm"
          data-tone={t.tone}
        >
          <div className="font-semibold text-slate-900">{t.message}</div>
          <button
            type="button"
            className="mt-2 text-xs text-slate-500 underline"
            onClick={() => dismissToast(t.id)}
            aria-label="關閉通知"
          >
            關閉
          </button>
        </div>
      ))}
    </div>
  );
}
