"use client";

import React from "react";

export type ViewState = "success" | "loading" | "empty" | "error";

export function DevStateToggle({ value, onChange }: { value: ViewState; onChange: (v: ViewState) => void }) {
  const options: ViewState[] = ["success", "loading", "empty", "error"];
  return (
    <div className="flex items-center gap-3 text-sm" data-testid="dev-state-toggle">
      <span className="text-slate-500">Dev state:</span>
      {options.map((opt) => (
        <label key={opt} className="inline-flex items-center gap-1">
          <input type="radio" name="view-state" value={opt} checked={value === opt} onChange={() => onChange(opt)} />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
