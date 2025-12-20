"use client";

import { useWorkspaceStore } from "../store/useWorkspaceStore";

export default function LoadingOverlay() {
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-50 text-sm text-slate-700">
      <div className="px-4 py-2 bg-white border border-slate-200 rounded-md shadow-sm">
        處理中，請稍候…
      </div>
    </div>
  );
}
