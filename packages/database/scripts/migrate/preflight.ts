import { COLUMNS, CONSTRAINTS, ColumnSpec, Constraint } from "@service/storage/postgres/provision";

/**
 * The PostgreSQL constraints, checked on the exported RethinkDB rows before
 * any of them is loaded. The migration adds the constraints after the load,
 * where the first violating row stops it with the whole import already done;
 * this finds every violating row up front, so the data is fixed in RethinkDB
 * and the migration runs once.
 */
export interface Violation {
  constraint: Constraint;
  id: string;
  detail: string;
}

/** calls `each` with every row of `table`, in any order; a table with no rows calls it never */
export type RowSource = (table: string, each: (row: Record<string, unknown>) => void) => Promise<void>;

const valueAt = (doc: Record<string, unknown>, path: string): unknown => {
  let value: unknown = doc;
  for (const part of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
};

/** `doc ->> 'a'` for the field at `path`: its text, null for a missing or null field */
const textAt = (doc: Record<string, unknown>, path: string): string | null => {
  const value = valueAt(doc, path);
  if (value === undefined || value === null) return null;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

/** the value the generated column `column` of `table` holds for `doc`, as PostgreSQL computes it */
export function columnValue(table: string, column: string, doc: Record<string, unknown>): string | string[] | null {
  const spec: ColumnSpec | undefined = COLUMNS[table]?.[column];
  if (spec === undefined) {
    throw new Error(`${table}.${column} is not a generated column`);
  }
  if (typeof spec === "string") return textAt(doc, spec);
  if ("ref" in spec) return textAt(doc, spec.ref) || null;
  if ("ids" in spec) {
    const value = valueAt(doc, spec.ids);
    return Array.isArray(value) ? value.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))) : [];
  }
  throw new Error(`${table}.${column} is computed by ${spec.fn}, which only PostgreSQL evaluates`);
}

/** every row of the constrained tables that PostgreSQL would reject, in row order per table */
export async function checkConstraints(rows: RowSource, constraints = CONSTRAINTS): Promise<Violation[]> {
  const referenced = new Set(constraints.filter((c) => c.kind === "foreign key").map((c) => (c as { references: string }).references));
  const ids = new Map<string, Set<string>>();
  for (const table of referenced) {
    const set = new Set<string>();
    await rows(table, (row) => {
      set.add(String(row.id));
    });
    ids.set(table, set);
  }

  const violations: Violation[] = [];
  for (const table of new Set(constraints.map((c) => c.table))) {
    const own = constraints.filter((c) => c.table === table);
    // unique: the key of every row seen so far -> the first row's id
    const seen = new Map<Constraint, Map<string, string>>(own.map((c) => [c, new Map()]));
    await rows(table, (row) => {
      const id = String(row.id);
      for (const c of own) {
        if (c.kind === "foreign key") {
          const value = columnValue(table, c.column, row) as string | null;
          if (value !== null && !ids.get(c.references)!.has(value)) {
            violations.push({ constraint: c, id, detail: `${c.column} = ${value} is not an id in ${c.references}` });
          }
          continue;
        }
        const values = c.columns.map((column) => columnValue(table, column, row));
        // a NULL never collides
        if (values.some((value) => value === null)) continue;
        const key = JSON.stringify(values);
        const first = seen.get(c)!.get(key);
        if (first === undefined) {
          seen.get(c)!.set(key, id);
        } else {
          violations.push({ constraint: c, id, detail: `(${c.columns.join(", ")}) = ${key} duplicates row ${first}` });
        }
      }
    });
  }
  return violations;
}
