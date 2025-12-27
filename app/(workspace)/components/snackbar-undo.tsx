"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface SnackbarUndoProps {
  open: boolean;
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onTimeout?: () => void;
  onClose?: () => void;
  actionLabel?: string;
  className?: string;
}

export default function SnackbarUndo({
  open,
  message,
  durationMs = 5000,
  onUndo,
  onTimeout,
  onClose,
  actionLabel = "撤銷",
  className
}: SnackbarUndoProps) {
  const [remaining, setRemaining] = useState(durationMs);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    startRef.current = Date.now();
    setRemaining(durationMs);

    const tick = () => {
      if (!startRef.current) return;
      const elapsed = Date.now() - startRef.current;
      setRemaining(Math.max(0, durationMs - elapsed));
    };

    const intervalId = window.setInterval(tick, 200);
    const timeoutId = window.setTimeout(() => {
      onTimeout?.();
      onClose?.();
    }, durationMs);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [durationMs, onClose, onTimeout, open]);

  if (!open) return null;

  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className={clsx("fixed bottom-4 left-1/2 -translate-x-1/2 z-50", className)}>
      <div className="flex items-center gap-3 rounded-md bg-slate-900 text-white px-4 py-3 shadow-lg min-w-[280px]">
        <div className="flex-1 text-sm leading-tight">
          <div>{message}</div>
          <div className="text-[11px] text-slate-300">將在 {seconds} 秒後自動執行</div>
        </div>
        <button
          type="button"
          onClick={() => {
            onUndo();
            onClose?.();
          }}
          className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
