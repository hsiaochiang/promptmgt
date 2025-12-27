"use client";

import clsx from "clsx";

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
  return (
    <div className={clsx("inline-flex items-center rounded-full bg-slate-100 p-1 text-sm", className)}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={clsx(
              "px-3 py-1.5 rounded-full transition-colors font-medium",
              isActive
                ? "bg-white shadow text-slate-900"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/60"
            )}
            aria-pressed={isActive}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
