"use client";

import { useEffect, useState } from "react";
import type { InboxItem } from "@/lib/types/schema";
import InboxList from "./components/inbox-list";
import DraftEditor from "./components/draft-editor";
import { useWorkspaceStore } from "./store/useWorkspaceStore";

export default function InboxWorkspace() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const setSelectedPromptId = useWorkspaceStore((s) => s.setSelectedPromptId);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
      setSelectedPromptId(items[0].id);
    }
  }, [items, selectedId, setSelectedPromptId]);

  const handleLoaded = (list: InboxItem[]) => {
    setItems(list);
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id);
      setSelectedPromptId(list[0].id);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSelectedPromptId(id);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex-shrink-0 basis-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold text-xs tracking-wide text-slate-600">收件匣</div>
        </div>
        <InboxList selectedId={selectedId} onSelect={handleSelect} onLoaded={handleLoaded} />
      </aside>
      <div className="w-[3px] cursor-col-resize bg-slate-200/70" />
      <main className="flex-1 bg-slate-50 p-4 overflow-auto">
        <DraftEditor
          draft={selected}
          projects={[]}
          onArchived={() => {}}
          onDeleted={() => {}}
        />
      </main>
    </div>
  );
}
