export type ShortcutAction =
  | "toggle-list"
  | "toggle-pin"
  | "toggle-snippets"
  | "new-prompt"
  | "new-draft"
  | "focus-search"
  | "focus-mode";

export function mapShortcut(event: KeyboardEvent): ShortcutAction | null {
  const key = event.key.toLowerCase();
  if (event.altKey && !event.shiftKey && key === "l") return "toggle-list";
  if (event.altKey && !event.shiftKey && key === "p") return "toggle-pin";
  if (event.altKey && !event.shiftKey && key === "s") return "toggle-snippets";
  if (event.altKey && event.shiftKey && key === "n") return "new-draft";
  if (event.altKey && !event.shiftKey && key === "n") return "new-prompt";
  if (event.ctrlKey && !event.shiftKey && key === "k") return "focus-search";
  if (event.ctrlKey && event.shiftKey && key === "f") return "focus-mode";
  return null;
}
