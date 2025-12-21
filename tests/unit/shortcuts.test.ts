import { describe, expect, it } from "vitest";
import { mapShortcut } from "@/app/(workspace)/utils/shortcuts";

function event(options: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    key: "",
    preventDefault: () => {},
    ...options
  } as KeyboardEvent;
}

describe("shortcut mapping", () => {
  it("maps Alt combos to list/pin/snippet", () => {
    expect(mapShortcut(event({ altKey: true, key: "l" }))).toBe("toggle-list");
    expect(mapShortcut(event({ altKey: true, key: "p" }))).toBe("toggle-pin");
    expect(mapShortcut(event({ altKey: true, key: "s" }))).toBe("toggle-snippets");
  });

  it("maps creation shortcuts", () => {
    expect(mapShortcut(event({ altKey: true, key: "n" }))).toBe("new-prompt");
    expect(mapShortcut(event({ altKey: true, shiftKey: true, key: "n" }))).toBe("new-draft");
  });

  it("maps focus/search and focus-mode", () => {
    expect(mapShortcut(event({ ctrlKey: true, key: "k" }))).toBe("focus-search");
    expect(mapShortcut(event({ ctrlKey: true, shiftKey: true, key: "f" }))).toBe("focus-mode");
  });

  it("ignores unrelated keys", () => {
    expect(mapShortcut(event({ key: "x" }))).toBeNull();
    expect(mapShortcut(event({ ctrlKey: true, key: "c" }))).toBeNull();
  });
});
