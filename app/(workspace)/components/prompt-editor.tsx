"use client";

import ConflictDialog from "./conflict-dialog";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

interface Props {
  promptId: string | null;
  initialFrontmatter: PromptFrontmatter | null;
  initialBody: string;
  clientHash: string | null;
  initialMtimeMs?: number | null;
  insertText?: string | null;
  onInserted?: () => void;
  onBodyChange?: (body: string) => void;
  onFrontmatterChange?: (frontmatter: PromptFrontmatter | null) => void;
}

export default function PromptEditor({
  promptId,
  initialFrontmatter,
  initialBody,
  clientHash,
  initialMtimeMs = null,
  insertText,
  onInserted,
  onBodyChange,
  onFrontmatterChange
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [frontmatter, setFrontmatter] = useState<PromptFrontmatter | null>(initialFrontmatter);
  const [hash, setHash] = useState<string | null>(clientHash);
  const [mtimeMs, setMtimeMs] = useState<number | null>(initialMtimeMs);
  const [conflictHash, setConflictHash] = useState<string | null>(null);
  const [conflictMtime, setConflictMtime] = useState<number | null>(null);
  const [conflictDetectedAt, setConflictDetectedAt] = useState<number | null>(null);
  const [conflictNotifyBy, setConflictNotifyBy] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [externalPreview, setExternalPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const recordTelemetry = async (event: string) => {
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, timestamp: new Date().toISOString() })
      });
    } catch {
      // ignore telemetry errors
    }
  };

  const setEditorDirty = useWorkspaceStore((s) => s.setEditorDirty);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);
  const extensions = useMemo(() => [markdown()], []);
  const { isSaving, error } = useAutosavePrompt({
    promptId,
    frontmatter,
    body,
    clientHash: hash,
    clientMtime: mtimeMs ?? undefined,
    onSaved: (nextHash, nextMtime) => {
      setHash(nextHash);
      if (nextMtime) setMtimeMs(nextMtime);
      setConflictHash(null);
      setConflictMtime(null);
      setConflictDetectedAt(null);
      setConflictNotifyBy(null);
      setShowConflictDialog(false);
    },
    onConflict: (serverHash, serverMtime) => {
      setConflictHash(serverHash);
      setConflictMtime(serverMtime ?? null);
      const detectedAt = Date.now();
      setConflictDetectedAt(detectedAt);
      setConflictNotifyBy(new Date(detectedAt + 5000).toISOString());
      // Do not show immediately, let the effect handle it
      recordTelemetry("conflict_detected");
    }
  });

  useEffect(() => {
    setBody(initialBody);
    setHash(clientHash);
    setMtimeMs(initialMtimeMs ?? null);
    setConflictHash(null);
    setConflictMtime(null);
    setConflictDetectedAt(null);
    setConflictNotifyBy(null);
    setShowConflictDialog(false);
    setExternalPreview(null);
  }, [initialBody, clientHash, initialMtimeMs]);

  useEffect(() => {
    setFrontmatter(initialFrontmatter);
    onFrontmatterChange?.(initialFrontmatter);
  }, [initialFrontmatter, onFrontmatterChange]);

  useEffect(() => {
    if (!conflictNotifyBy || showConflictDialog) return;
    const deadline = new Date(conflictNotifyBy).getTime();
    const delay = Math.max(0, Math.min(5000, deadline - Date.now()));
    const timer = window.setTimeout(() => {
        setShowConflictDialog(true);
        recordTelemetry("conflict_dialog_shown");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [conflictNotifyBy, showConflictDialog]);

  useEffect(() => {
    if (!insertText) return;
    setBody((prev) => {
      const next = `${(prev ?? "").length ? `${prev}\n` : ""}${insertText}`;
      // Defer parent updates to avoid setState during render warnings
      setTimeout(() => {
        onBodyChange?.(next);
        setEditorDirty(true);
        onInserted?.();
      }, 0);
      return next;
    });
  }, [insertText, onInserted, onBodyChange, setEditorDirty]);

  const reloadExternal = async () => {
    if (!promptId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const data = await res.json();
      setFrontmatter(data.frontmatter);
      onFrontmatterChange?.(data.frontmatter);
      setBody(data.body);
      setHash(data.hash);
      if (data.mtimeMs) setMtimeMs(data.mtimeMs);
      onBodyChange?.(data.body);
      setConflictHash(null);
      setExternalPreview(null);
      setEditorDirty(false);
      setShowConflictDialog(false);
      recordTelemetry("conflict_resolved_external");
    } finally {
      setBusy(false);
    }
  };

  const overwriteWithLocal = async () => {
    if (!promptId || !frontmatter || !conflictHash) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const current = await res.json();
      const forceHash = current?.hash ?? conflictHash;
      const saveRes = await fetch(`/api/prompts/${promptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frontmatter, body, clientHash: forceHash })
      });
      const data = await saveRes.json();
      if (data.hash) {
        setHash(data.hash);
        if (data.mtimeMs) setMtimeMs(data.mtimeMs);
        setConflictHash(null);
        setExternalPreview(null);
        setEditorDirty(false);
        setShowConflictDialog(false);
        recordTelemetry("conflict_resolved_local");
      }
    } finally {
      setBusy(false);
    }
  };

  const previewExternal = async () => {
    if (!promptId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/prompts/${promptId}`);
      const data = await res.json();
      setExternalPreview(buildFullContent(data.frontmatter, data.body));
      recordTelemetry("conflict_view_diff");
    } finally {
      setBusy(false);
    }
  };

  if (!promptId || !frontmatter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
        請從列表選擇提示詞
      </div>
    );
  }

  return (
    <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col relative">
      <ConflictDialog
        open={showConflictDialog}
        localDate={mtimeMs}
        externalDate={conflictMtime}
        diffContent={externalPreview}
        isBusy={busy}
        onLoadExternal={reloadExternal}
        onKeepLocal={overwriteWithLocal}
        onViewDiff={() => {
          if (externalPreview) setExternalPreview(null);
          else previewExternal();
        }}
      />
      {conflictHash && !showConflictDialog && (
        <div className="absolute inset-x-0 top-0 z-10 bg-amber-50 border-b border-amber-200 p-3 shadow-sm animate-in fade-in slide-in-from-top-1">

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <span className="font-semibold">⚠️ 衝突警報：</span>
              <span>偵測到外部變更，自動儲存已暫停。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reloadExternal}
                disabled={busy}
                className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded text-xs hover:bg-amber-100 transition-colors disabled:opacity-60"
              >
                載入外部變更
              </button>
              <button
                onClick={overwriteWithLocal}
                disabled={busy}
                className="px-3 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors disabled:opacity-60"
              >
                保留本地(覆寫)
              </button>
              <button
                onClick={previewExternal}
                disabled={busy}
                className="px-3 py-1 text-amber-700 text-xs hover:underline disabled:opacity-60"
              >
                檢視差異
              </button>
            </div>
          </div>
          {externalPreview && (
            <div className="mt-2 text-[11px] text-amber-900 bg-white border border-amber-200 rounded p-2 max-h-32 overflow-auto whitespace-pre-wrap">
              {externalPreview}
            </div>
          )}
        </div>
      )}
      <div className="h-10 px-3 flex items-center justify-between text-[12px] text-slate-500 border-b border-slate-200 bg-slate-50">
        <span>提示詞內容（Markdown 編輯區）</span>
        <span className="flex items-center gap-2">
          {error && !conflictHash && <span className="text-amber-600">{error}</span>}
          {isSaving ? "自動儲存中…" : lastSavedAt ? `已儲存：${lastSavedAt}` : "等待編輯"}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={body}
          height="100%"
          extensions={extensions}
          onChange={(val) => {
            setBody(val);
            onBodyChange?.(val);
            setEditorDirty(true);
          }}
          theme="light"
        />
      </div>
    </div>
  );
}
