/**
 * Comparison of one document as read from RethinkDB with the same document as
 * read from PostgreSQL. Object keys are order-insensitive, arrays are
 * order-sensitive, and the first differing path is what gets reported.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * RethinkDB keeps a time as a double of seconds and rethinkdb-ts truncates it
 * back to milliseconds on read, so a stored Date can come back 1 ms early.
 */
const sameInstant = (a: string, b: string): boolean =>
  ISO_DATE.test(a) && ISO_DATE.test(b) && Math.abs(Date.parse(a) - Date.parse(b)) <= 1;

/** RethinkDB hands back Dates, PostgreSQL the ISO strings the seeder wrote */
export function normalize(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) {
        out[key] = normalize(item);
      }
    }
    return out;
  }
  return value;
}

/** path of the first difference between two normalized values, null when equal */
export function firstDifference(a: unknown, b: unknown, path = "$"): string | null {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return path;
    }
    if (a.length !== b.length) {
      return `${path}.length`;
    }
    for (let i = 0; i < a.length; i++) {
      const diff = firstDifference(a[i], b[i], `${path}[${i}]`);
      if (diff) {
        return diff;
      }
    }
    return null;
  }
  const objects =
    typeof a === "object" && a !== null && typeof b === "object" && b !== null;
  if (objects) {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    for (const key of keys) {
      const diff = firstDifference(left[key], right[key], `${path}.${key}`);
      if (diff) {
        return diff;
      }
    }
    return null;
  }
  if (a === b) {
    return null;
  }
  if (typeof a === "string" && typeof b === "string" && sameInstant(a, b)) {
    return null;
  }
  return path;
}
