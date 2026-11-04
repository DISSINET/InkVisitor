/**
 * Makes a recorded value byte-stable across two runs of the same code.
 *
 * Generated ids are replaced by an alias numbered by first appearance. That
 * is stable only because the request list is fixed and sequential: the first
 * time an id shows up is in the response of the write that created it, at a
 * deterministic position. Datetime strings collapse to one token; the date
 * itself is the volatile part, the shape (ISO string vs. something else)
 * still has to match. Object keys are sorted on output so field order is not
 * part of the contract, but aliases are assigned in received order because a
 * map keyed by generated ids has no other stable order.
 *
 * Array order is kept, except where a step declares a SortSpec: RethinkDB
 * returns unordered reads (table scans, getAll) in storage order, and that
 * order changes between two seeds as soon as a row with a random id has been
 * inserted. Those lists are pinned after normalization, so aliased ids sort
 * deterministically.
 */
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
// stats buckets are keyed by the day / month of the run
const DATE_KEY = /^\d{4}-\d{2}(?:-\d{2})?$/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export class Normalizer {
  private aliases = new Map<string, string>();

  private alias(id: string): string {
    const key = id.toLowerCase();
    let alias = this.aliases.get(key);
    if (!alias) {
      alias = `<uuid-${this.aliases.size + 1}>`;
      this.aliases.set(key, alias);
    }
    return alias;
  }

  text(value: string): string {
    if (ISO_DATETIME.test(value)) return "<datetime>";
    return value.replace(UUID, (id) => this.alias(id));
  }

  value(value: unknown): unknown {
    if (typeof value === "string") return this.text(value);
    if (Array.isArray(value)) return value.map((item) => this.value(item));
    if (value && typeof value === "object") {
      const entries: [string, unknown][] = Object.entries(value).map(([key, item]) => [
        DATE_KEY.test(key) ? "<date>" : this.text(key),
        this.value(item),
      ]);
      entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      const out: Record<string, unknown> = {};
      for (const [key, item] of entries) out[key] = item;
      return out;
    }
    return value;
  }
}

/** Sort the array found at `at`, by the element paths in `by` (empty = the whole element). */
export interface SortSpec {
  /** dot path to the array; "" is the root, "*" descends into every element / value */
  at: string;
  /** element dot paths ranked in order; [] ranks the element itself */
  by: string[];
  /** only reorder runs of adjacent elements whose value at this path is equal */
  within?: string;
}

export function getPath(value: unknown, dotPath: string): unknown {
  if (dotPath === "") return value;
  return dotPath
    .split(".")
    .reduce<any>((cur, key) => (cur == null ? undefined : cur[key]), value);
}

/** Every value reached by `dotPath`, expanding "*" over array elements and object values. */
function expand(value: unknown, dotPath: string): unknown[] {
  if (dotPath === "") return [value];
  let current: unknown[] = [value];
  for (const key of dotPath.split(".")) {
    const next: unknown[] = [];
    for (const item of current) {
      if (item == null || typeof item !== "object") continue;
      if (key === "*") next.push(...Object.values(item));
      else next.push((item as Record<string, unknown>)[key]);
    }
    current = next;
  }
  return current;
}

export function stripPaths(value: unknown, dotPaths: string[]): void {
  for (const dotPath of dotPaths) {
    const keys = dotPath.split(".");
    const last = keys.pop() as string;
    for (const parent of expand(value, keys.join("."))) {
      if (parent && typeof parent === "object" && last in (parent as object)) {
        (parent as Record<string, unknown>)[last] = "<stripped>";
      }
    }
  }
}

type Rank = (number | string)[];
const rankValue = (v: unknown): number | string =>
  typeof v === "number" ? v : JSON.stringify(v) ?? "undefined";
const compareRanks = (a: Rank, b: Rank): number => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
};

export function sortAt(value: unknown, spec: SortSpec): void {
  const rank = (row: unknown): Rank =>
    spec.by.length ? spec.by.map((k) => rankValue(getPath(row, k))) : [rankValue(row)];
  const compare = (a: unknown, b: unknown) => compareRanks(rank(a), rank(b));

  for (const target of expand(value, spec.at)) {
    if (!Array.isArray(target)) continue;
    if (!spec.within) {
      target.sort(compare);
      continue;
    }
    let start = 0;
    while (start < target.length) {
      const group = rankValue(getPath(target[start], spec.within));
      let end = start + 1;
      while (end < target.length && rankValue(getPath(target[end], spec.within)) === group) end++;
      target.splice(start, end - start, ...target.slice(start, end).sort(compare));
      start = end;
    }
  }
}
