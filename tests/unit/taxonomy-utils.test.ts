import { describe, expect, it } from "vitest";
import { normalizeTaxonomyArray, normalizeTaxonomyValue, validateTaxonomyValue } from "@/lib/utils/taxonomy";

describe("normalizeTaxonomyArray", () => {
  it("ignores invalid/empty values and de-duplicates case-insensitively", () => {
    const result = normalizeTaxonomyArray([
      "a",
      "",
      "   ",
      "A",
      123,
      { code: "", name: "" },
      { code: "b", name: "b" },
      { code: "x", name: "" }
    ]);

    expect(result).toEqual([
      { code: "a", name: "a" },
      { code: "b", name: "b" },
      { code: "x", name: "x" }
    ]);
  });
});

describe("normalizeTaxonomyValue / validateTaxonomyValue", () => {
  it("resolves by name with table and rejects code/name mismatch", () => {
    const table = { A: "Alpha" };

    expect(normalizeTaxonomyValue("free")).toEqual({ code: "free", name: "free" });
    expect(validateTaxonomyValue({ code: "x", name: "y" })).toEqual({ code: "x", name: "y" });

    expect(normalizeTaxonomyValue("A", table)).toEqual({ code: "A", name: "Alpha" });

    expect(normalizeTaxonomyValue("Alpha", table)).toEqual({ code: "A", name: "Alpha" });
    expect(() => normalizeTaxonomyValue({ code: "A", name: "Wrong" }, table)).toThrow(
      /taxonomy code\/name mismatch/
    );

    expect(() => validateTaxonomyValue({ code: "A", name: "Wrong" }, table)).toThrow(
      /taxonomy code\/name mismatch/
    );
    expect(validateTaxonomyValue({ code: "A", name: "Alpha" }, table)).toEqual({ code: "A", name: "Alpha" });
  });
});
