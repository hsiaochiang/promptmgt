"use client";

import clsx from "clsx";
import { useMemo, useRef } from "react";

interface TabItem {
  key: string;
  label: string;
}

interface EditorTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function EditorTabs({ tabs, activeKey, onChange, className }: EditorTabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const order = useMemo(() => tabs.map((t) => t.key), [tabs]);

  const focusTab = (key: string) => {
    const ref = tabRefs.current[key];
    ref?.focus();
  };

  const moveFocus = (currentKey: string, direction: 1 | -1) => {
    const idx = order.indexOf(currentKey);
    if (idx === -1) return;
    const nextIdx = (idx + direction + order.length) % order.length;
    const nextKey = order[nextIdx];
    onChange(nextKey);
    focusTab(nextKey);
  };

  return (
    <div
      className={clsx("inline-flex items-center rounded-full bg-slate-100 p-1 text-sm", className)}
      role="tablist"
      aria-label="編輯模式切換"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={(el) => (tabRefs.current[tab.key] = el)}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveFocus(tab.key, 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveFocus(tab.key, -1);
              } else if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChange(tab.key);
              }
            }}
            className={clsx(
              "px-3 py-1.5 rounded-full transition-colors font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500",
              isActive
                ? "bg-white shadow text-slate-900"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/60"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
