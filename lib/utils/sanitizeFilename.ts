const ILLEGAL_CHARS = /[\/\\:\*\?"<>\|]/g;

export function sanitizeFilename(input: string) {
  const replaced = input.trim().replace(/\s+/g, "-").replace(ILLEGAL_CHARS, "-");
  return replaced.length > 0 ? replaced : "untitled";
}
