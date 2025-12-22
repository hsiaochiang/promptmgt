import { NextResponse } from "next/server";
import { getSettings } from "@/lib/services/settings";
import { listPrompts } from "@/lib/fs/prompts";
import { getDb } from "@/lib/db";
import { toIsoWithOffset } from "@/lib/utils/date";

interface ChangeReportItem {
  id: string;
  kind: "prompt" | "inbox";
  title: string;
  action: string;
  timestamp: string;
  path?: string;
  projectId?: string;
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

export async function GET(_request: Request) {
  try {
    const settings = await getSettings();
    const since = Date.now() - WINDOW_MS;

    const prompts = await listPrompts(settings.rootPath ?? "");
    const promptItems: ChangeReportItem[] = prompts
      .map((prompt) => {
        const ts = parseTimestamp(prompt.updatedAt ?? prompt.createdAt ?? null);
        if (ts === null) return null;
        if (ts < since) return null;

        const createdTs = parseTimestamp((prompt as any).createdAt ?? null);
        const isNew = createdTs !== null && createdTs >= since;
        const action = isNew ? "新增提示詞" : "更新提示詞";

        return {
          id: prompt.id,
          kind: "prompt" as const,
          title: prompt.title,
          action,
          timestamp: toIsoWithOffset(new Date(ts)),
          path: prompt.path,
          projectId: prompt.projectId
        } satisfies ChangeReportItem;
      })
      .filter(Boolean) as ChangeReportItem[];

    const db = await getDb();
    const inboxItems: ChangeReportItem[] = (db.data?.inbox ?? [])
      .map((item) => {
        const ts = parseTimestamp(item.updatedAt ?? item.createdAt ?? null);
        if (ts === null) return null;
        if (ts < since) return null;

        const createdTs = parseTimestamp(item.createdAt ?? null);
        const isNew = createdTs !== null && createdTs >= since;
        const action = isNew ? "新增草稿" : "更新草稿";

        return {
          id: item.id,
          kind: "inbox" as const,
          title: item.title || "未命名草稿",
          action,
          timestamp: toIsoWithOffset(new Date(ts)),
          path: "收件匣"
        } satisfies ChangeReportItem;
      })
      .filter(Boolean) as ChangeReportItem[];

    const merged = [...promptItems, ...inboxItems]
      .sort((a, b) => parseTimestamp(b.timestamp)! - parseTimestamp(a.timestamp)!)
      .slice(0, 50);

    return NextResponse.json(merged);
  } catch (err) {
    const message = err instanceof Error ? err.message : "change report unavailable";
    return NextResponse.json({ message }, { status: 500 });
  }
}
