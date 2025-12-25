"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { InboxItem, Project, PromptStatus, PromptType } from "@/lib/types/schema";
import { useAutosaveDraft } from "../hooks/useAutosaveDraft";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

interface Props {
  draft: InboxItem | null;
  projects: Project[];
  onArchived: (result: { promptId?: string; projectName?: string }) => void;
  onDeleted: () => void;
}

const LARGE_PASTE_THRESHOLD = 100000;

export default function DraftEditor({ draft, projects, onArchived, onDeleted }: Props) {
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [content, setContent] = useState("");
  const [pasting, setPasting] = useState(false);
  const [archiveProject, setArchiveProject] = useState<string>("");
  const [archiveStatus, setArchiveStatus] = useState<PromptStatus>("使用中");
  const [archiveType, setArchiveType] = useState<PromptType>("其他");
  const [archiveModel, setArchiveModel] = useState("gpt-4o-mini");
  const [archiveTags, setArchiveTags] = useState("");
  const [archiveNote, setArchiveNote] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const setLoading = useWorkspaceStore((s) => s.setLoading);
  const setLastSavedAt = useWorkspaceStore((s) => s.setLastSavedAt);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const { isSaving } = useAutosaveDraft({
    draftId: draft?.id ?? null,
    title,
    content,
    hint
  });

  useEffect(() => {
    if (!draft) {
      setTitle("");
      setHint("");
      setContent("");
      setLastSavedAt(null);
      return;
    }
    setTitle(draft.title);
    setHint(draft.hint ?? "");
    setContent(draft.content ?? "");
    setLastSavedAt(draft.updatedAt ?? null);
  }, [draft]);

  useEffect(() => {
    if (archiveProject) return;
    if (projects.length > 0) {
      setArchiveProject(projects[0].name);
    }
  }, [projects, archiveProject]);

  const tagsArray = useMemo(
    () =>
      archiveTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [archiveTags]
  );

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (pasted.length > LARGE_PASTE_THRESHOLD) {
      setPasting(true);
      setLoading(true);
      setTimeout(() => {
        setPasting(false);
        setLoading(false);
      }, 500);
    }
  };

  const handleArchive = async () => {
    if (!draft) return;
    const projectName = archiveProject || projects[0]?.name;
    if (!projectName) {
      window.alert("請先建立專案再進行歸檔");
      return;
    }

    setArchiving(true);
    try {
      const res = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          projectName,
          frontmatter: {
            title: title || "未命名草稿",
            project: projectName,
            type: archiveType,
          status: archiveStatus,
          model: archiveModel,
          tags: tagsArray,
          note: archiveNote,
          updatedAt: new Date().toISOString(),
          createdAt: draft.createdAt ?? new Date().toISOString()
        },
        body: content
      })
    });
    if (!res.ok) throw new Error("歸檔失敗");
    const data = await res.json();
    onArchived({ ...data, projectName });
    setShowArchiveDialog(false);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "歸檔失敗");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft) return;
    if (!window.confirm("確定刪除此草稿？")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inbox/${draft.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("刪除失敗");
      onDeleted();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setDeleting(false);
    }
  };

  if (!draft) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        請從左側選擇或新增一筆收件匣草稿
      </div>
    );
  }

  return (
    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="h-10 px-3 flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-200 bg-slate-50">
        <span>收件匣草稿（自動儲存）</span>
        <span className="flex items-center gap-2">
          {pasting && <span className="text-amber-600">大型貼上處理中…</span>}
          {isSaving ? "自動儲存中…" : lastSavedAt ? `已儲存：${lastSavedAt}` : "等待編輯"}
        </span>
      </div>
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-[11px] flex-wrap">
        <div className="flex items-center gap-2 flex-wrap text-slate-600">
          <span className="font-semibold text-slate-800">歸檔設定</span>
          <span>專案：{archiveProject || "尚未選擇"}</span>
          <span>狀態：{archiveStatus}</span>
          <span>類型：{archiveType}</span>
          <span>模型：{archiveModel}</span>
          <span className="text-slate-500">
            標籤：{tagsArray.length > 0 ? tagsArray.join(", ") : "尚未設定"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting || archiving}
            className="px-3 py-1 rounded-full border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-60"
          >
            {deleting ? "刪除中…" : "刪除草稿"}
          </button>
          <button
            onClick={() => setShowArchiveDialog(true)}
            disabled={archiving || deleting}
            className="px-3 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {archiving ? "歸檔中…" : "歸檔為提示詞"}
          </button>
        </div>
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-auto">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">標題</label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setEditorDirty(true);
            }}
            placeholder="輸入草稿標題"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">提示/備註</label>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            value={hint}
            onChange={(e) => {
              setHint(e.target.value);
              setEditorDirty(true);
            }}
            placeholder="提醒自己專案/標籤或後續動作"
          />
        </div>
        <div className="space-y-1 flex-1 flex flex-col min-h-[240px]">
          <label className="text-xs text-slate-500">內容（Markdown 支援）</label>
          <textarea
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setEditorDirty(true);
            }}
            onPaste={handlePaste}
            placeholder="開始撰寫或貼上草稿內容，系統將自動儲存"
          />
        </div>
      </div>
      {showArchiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">將草稿歸檔為提示詞</div>
                <div className="text-[11px] text-slate-500">請確認標題與目標專案後提交</div>
              </div>
              <button
                onClick={() => setShowArchiveDialog(false)}
                className="text-slate-500 hover:text-slate-800 text-sm"
                aria-label="關閉歸檔對話框"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-3 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">標題</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setEditorDirty(true);
                  }}
                  placeholder="輸入草稿標題"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">目標專案</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                    value={archiveProject}
                    onChange={(e) => setArchiveProject(e.target.value)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">狀態</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                    value={archiveStatus}
                    onChange={(e) => setArchiveStatus(e.target.value as PromptStatus)}
                  >
                    <option value="使用中">使用中</option>
                    <option value="草稿">草稿</option>
                    <option value="已封存">已封存</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">類型</label>
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-slate-400"
                    value={archiveType}
                    onChange={(e) => setArchiveType(e.target.value as PromptType)}
                  >
                    <option value="簡報生成">簡報生成</option>
                    <option value="結構設計">結構設計</option>
                    <option value="RAG 調教">RAG 調教</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold">模型</label>
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                    value={archiveModel}
                    onChange={(e) => setArchiveModel(e.target.value)}
                    placeholder="例如：gpt-4o-mini"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">標籤（以逗號分隔）</label>
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  value={archiveTags}
                  onChange={(e) => setArchiveTags(e.target.value)}
                  placeholder="如：RAG, 文案, 產碼"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold">前言備註（選填）</label>
                <textarea
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                  value={archiveNote}
                  onChange={(e) => setArchiveNote(e.target.value)}
                  placeholder="補充使用說明或注意事項"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowArchiveDialog(false)}
                className="px-3 py-1 rounded-full border border-slate-300 bg-white text-[11px] hover:bg-slate-50"
                disabled={archiving}
              >
                取消
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving || deleting}
                className="px-3 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {archiving ? "歸檔中…" : "確認歸檔"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
