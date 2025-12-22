import { describe, expect, it } from "vitest";
import { formatForUI_HHmm, formatForUI_MMDD_HHmm, toIsoWithOffset } from "@/lib/utils/date";

describe("toIsoWithOffset", () => {
  it("emits ISO string with +08:00 and keeps the same instant", () => {
    const base = new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
    const iso = toIsoWithOffset(base);
    expect(iso.endsWith("+08:00")).toBe(true);
    expect(new Date(iso).getTime() + 8 * 60 * 60 * 1000).toBe(base.getTime());
  });

  it("supports negative offsets", () => {
    const base = new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0));
    const iso = toIsoWithOffset(base, -5);
    expect(iso.endsWith("-05:00")).toBe(true);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });
});

describe("formatters", () => {
  it("formats MM/DD HH:mm and HH:mm in UTC+08", () => {
    const iso = toIsoWithOffset(new Date(Date.UTC(2025, 5, 15, 4, 30, 0, 0)));
    expect(formatForUI_MMDD_HHmm(iso)).toBe("06/15 04:30");
    expect(formatForUI_HHmm(iso)).toBe("04:30");
  });

  it("falls back to input when formatting fails", () => {
    const bad: any = {
      [Symbol.toPrimitive]: () => {
        throw new Error("boom");
      }
    };
    expect(formatForUI_MMDD_HHmm(bad as any)).toBe(bad);
    expect(formatForUI_HHmm(bad as any)).toBe(bad);
  });
});
