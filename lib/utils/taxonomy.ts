import type { TaxonomyValue } from "../taxonomy/data";

export type TaxonomyTable = Record<string, string>;

export function toTaxonomyTable(values: TaxonomyValue[]): TaxonomyTable {
  return values.reduce<TaxonomyTable>((acc, item) => {
    acc[item.code] = item.name;
    return acc;
  }, {});
}

export function normalizeTaxonomyValue(input: unknown, table?: TaxonomyTable): TaxonomyValue {
  if (typeof input === "string") {
    const code = input.trim();
    const name = table?.[code] ?? code;
    return { code, name };
  }

  if (input && typeof input === "object") {
    const payload = input as Record<string, unknown>;
    const code = typeof payload.code === "string" ? payload.code.trim() : "";
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!code || !name) {
      throw new Error("taxonomy value requires code and name");
    }
    if (table && table[code] && table[code] !== name) {
      throw new Error(`taxonomy code/name mismatch: ${code}`);
    }
    return { code, name: table?.[code] ?? name };
  }

  throw new Error("invalid taxonomy value");
}

export function normalizeTaxonomyArray(values: unknown, table?: TaxonomyTable): TaxonomyValue[] {
  const arr = Array.isArray(values) ? values : [];
  const seen = new Set<string>();
  const result: TaxonomyValue[] = [];

  for (const item of arr) {
    const normalized = normalizeTaxonomyValue(item, table);
    const key = normalized.code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

export function validateTaxonomyValue(value: TaxonomyValue, table?: TaxonomyTable): TaxonomyValue {
  if (!table) return value;
  const expected = table[value.code];
  if (expected && expected !== value.name) {
    throw new Error(`taxonomy code/name mismatch: ${value.code}`);
  }
  return value;
}
