import type { TaxonomyValue } from "../taxonomy/data";

export type TaxonomyTable = Record<string, string>;

export function toTaxonomyTable(values: TaxonomyValue[]): TaxonomyTable {
  return values.reduce<TaxonomyTable>((acc, item) => {
    acc[item.code] = item.name;
    return acc;
  }, {});
}

function resolveCodeAndName(text: string, table?: TaxonomyTable): TaxonomyValue {
  const trimmed = text.trim();
  if (!table) return { code: trimmed, name: trimmed };
  const directName = table[trimmed];
  if (directName) return { code: trimmed, name: directName };

  const matchByName = Object.entries(table).find(([, name]) => name === trimmed);
  if (matchByName) {
    const [code, name] = matchByName;
    return { code, name };
  }
  return { code: trimmed, name: trimmed };
}

export function normalizeTaxonomyValue(input: unknown, table?: TaxonomyTable): TaxonomyValue {
  if (typeof input === "string") {
    return resolveCodeAndName(input, table);
  }

  if (input && typeof input === "object") {
    const payload = input as Record<string, unknown>;
    const code = typeof payload.code === "string" ? payload.code.trim() : "";
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (code && name) {
      if (table && table[code] && table[code] !== name) {
        throw new Error(`taxonomy code/name mismatch: ${code}`);
      }
      return { code, name: table?.[code] ?? name };
    }
    if (code || name) {
      return resolveCodeAndName(code || name, table);
    }
  }

  throw new Error("invalid taxonomy value");
}

export function normalizeTaxonomyArray(values: unknown, table?: TaxonomyTable): TaxonomyValue[] {
  const arr = Array.isArray(values) ? values : [];
  const seen = new Set<string>();
  const result: TaxonomyValue[] = [];

  for (const item of arr) {
    let normalized: TaxonomyValue;
    try {
      normalized = normalizeTaxonomyValue(item, table);
    } catch {
      continue;
    }

    if (!normalized.code.trim() || !normalized.name.trim()) {
      continue;
    }

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
