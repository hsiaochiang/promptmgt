import React from "react";
import type { WorkspaceTab } from "../store/useWorkspaceStore";

const COPY: Record<WorkspaceTab, { title: string; helper: string }> = {
  projects: { title: "專案佈局即將到來", helper: "在此檢視專案列表與 Side KPI。" },
  prompts: { title: "提示詞清單", helper: "切換到提示詞可查看列表與編輯內容。" },
  scratchpad: { title: "剪貼簿工作區", helper: "在此整理草稿並準備另存為提示詞。" }
};

export default function TabPlaceholders({ tab }: { tab: WorkspaceTab }) {
  const copy = COPY[tab];
  return (
    <div className="flex flex-1 overflow-hidden gap-6">
      <section
        className="pm-panel flex-[1.2] flex flex-col items-center justify-center gap-2 text-sm"
        data-testid="tab-placeholder-main"
        data-tab={tab}
      >
        <div className="font-semibold">{copy.title}</div>
        <div style={{ color: "var(--pm-muted)" }}>{copy.helper}</div>
      </section>
      <aside
        className="pm-panel flex-1 flex flex-col items-center justify-center gap-2 text-sm"
        data-testid="tab-placeholder-side"
        data-tab={tab}
      >
        <div className="text-xs uppercase tracking-wide" style={{ color: "var(--pm-muted)" }}>
          Side
        </div>
        <div>此區顯示 {copy.title}</div>
      </aside>
    </div>
  );
}
