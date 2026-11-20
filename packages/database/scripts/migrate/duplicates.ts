import { CONSTRAINTS } from "@service/storage/postgres/provision";
import { checkConstraints, RowSource, Violation } from "./preflight";

type Row = Record<string, unknown>;

/** per table, the order that puts the copy of a duplicate row to keep first */
export type KeepFirst = Record<string, (a: Row, b: Row) => number>;

const byId = (a: Row, b: Row): number => (String(a.id) < String(b.id) ? -1 : 1);

const relationOrder = (rel: Row): number => (typeof rel.order === "number" ? rel.order : Infinity);

const permissionRank = (row: Row): number => {
  const roles = Array.isArray(row.roles) ? row.roles : [];
  return (row.public ? 1000 : 0) + (roles.includes("*") ? 100 : 0) + roles.length;
};

/**
 * Which copy of a duplicate row stays: the relation with the lowest `order`,
 * the acl_permissions row granting the most (public, then "*", then the most
 * roles), then the smallest id. `users` has no entry: audits and saved queries
 * refer to a user, so which account stays is a decision for a person.
 */
export const KEEP_FIRST: KeepFirst = {
  relations: (a, b) => relationOrder(a) - relationOrder(b) || byId(a, b),
  acl_permissions: (a, b) => permissionRank(b) - permissionRank(a) || byId(a, b),
};

export interface Skipped {
  table: string;
  row: Row;
  /** the id of the copy that stays */
  kept: string;
}

export interface SkipPlan {
  /** the duplicate rows a migration leaves out */
  skipped: Skipped[];
  /** the violations among the rows that remain; any of them stops the migration */
  blocking: Violation[];
}

/** table -> ids of its rows left out */
export function skippedIds(skipped: Skipped[]): Map<string, Set<string>> {
  const ids = new Map<string, Set<string>>();
  for (const s of skipped) {
    ids.set(s.table, (ids.get(s.table) ?? new Set<string>()).add(String(s.row.id)));
  }
  return ids;
}

/**
 * Leaves out every duplicate row but the copy `keepFirst` ranks first; a table
 * without a rule gives up no row. The constraints are then checked again over
 * the rows that remain, so `blocking` also names a reference to a row left out.
 */
export async function planSkips(rows: RowSource, constraints = CONSTRAINTS, keepFirst = KEEP_FIRST): Promise<SkipPlan> {
  const violations = await checkConstraints(rows, constraints);
  // one group per key: the first row holding it, then every later copy
  const groups = new Map<string, { table: string; ids: string[] }>();
  for (const v of violations) {
    if (v.duplicateOf === undefined || !(v.constraint.table in keepFirst)) continue;
    const key = `${v.constraint.name} ${v.duplicateOf}`;
    const group = groups.get(key) ?? { table: v.constraint.table, ids: [v.duplicateOf] };
    group.ids.push(v.id);
    groups.set(key, group);
  }

  const skipped: Skipped[] = [];
  for (const table of new Set([...groups.values()].map((group) => group.table))) {
    const own = [...groups.values()].filter((group) => group.table === table);
    const members = new Set(own.flatMap((group) => group.ids));
    const docs = new Map<string, Row>();
    await rows(table, (row) => {
      if (members.has(String(row.id))) docs.set(String(row.id), row);
    });
    for (const group of own) {
      const [keep, ...rest] = group.ids.map((id) => docs.get(id)!).sort(keepFirst[table]);
      skipped.push(...rest.map((row) => ({ table, row, kept: String(keep.id) })));
    }
  }
  if (!skipped.length) {
    return { skipped, blocking: violations };
  }

  const left = skippedIds(skipped);
  const remaining: RowSource = (table, each) =>
    rows(table, (row) => {
      if (!left.get(table)?.has(String(row.id))) each(row);
    });
  return { skipped, blocking: await checkConstraints(remaining, constraints) };
}
