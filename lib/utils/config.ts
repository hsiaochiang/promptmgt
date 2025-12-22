const DEFAULT_INBOX_PAGE_SIZE = 50;
const MIN_INBOX_PAGE_SIZE = 10;
const MAX_INBOX_PAGE_SIZE = 200;

function clampInboxPageSize(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_INBOX_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(value), MIN_INBOX_PAGE_SIZE), MAX_INBOX_PAGE_SIZE);
}

export function getInboxPageSize() {
  const raw = process.env.NEXT_PUBLIC_INBOX_PAGE_SIZE ?? process.env.INBOX_PAGE_SIZE;
  if (!raw) return DEFAULT_INBOX_PAGE_SIZE;
  const parsed = Number(raw);
  return clampInboxPageSize(parsed);
}

export const INBOX_PAGE_SIZE_DEFAULT = DEFAULT_INBOX_PAGE_SIZE;
