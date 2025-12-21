const ILLEGAL_CHARS = /[\/\\:\*\?"<>\|]/g;
const RESERVED_BASENAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9"
]);

export function sanitizeFilename(input: string | undefined | null) {
  const base = (input ?? "").toString().trim();
  const replaced = base.replace(/\s+/g, "-").replace(ILLEGAL_CHARS, "-");
  const collapsed = replaced.replace(/-+/g, "-");
  const trimmedDots = collapsed.replace(/^\.+|\.+$/g, "");
  const limited = trimmedDots.slice(0, 100);
  const fallback = limited.length > 0 ? limited : "untitled";
  const lower = fallback.toLowerCase();
  if (RESERVED_BASENAMES.has(lower)) {
    return `${fallback}_`;
  }
  return fallback;
}
