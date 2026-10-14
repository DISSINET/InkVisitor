import { Row } from "../types";
import { TABLES, pgIndexName } from "./provision";

/** a quoted SQL identifier */
export const ident = (name: string): string => `"${name.replace(/"/g, '""')}"`;

/**
 * JSON text of `value` as it goes into a jsonb parameter. Dates become their
 * ISO-8601 UTC string, which is what the seeder wrote and what the indexes
 * expect. jsonb rejects U+0000 inside strings, so the code point is dropped
 * from every string value before serializing.
 */
export function encode(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "string" ? v.replace(/\u0000/g, "") : v));
}

const DATE_FIELDS: Record<string, string[]> = {
  audits: ["date"],
  documents: ["createdAt", "updatedAt"],
  saved_queries: ["createdAt", "updatedAt"],
  users: ["deletedAt"],
  entities: ["createdAt", "updatedAt"],
};

/** fields of `table` that RethinkDB returned as Date objects */
export function dateFields(table: string): string[] {
  if (table.startsWith("stats_materialized_")) {
    return ["lastUpdated"];
  }
  return DATE_FIELDS[table] ?? [];
}

/** turns the date fields of a stored document back into Date objects, in place */
export function revive<T extends Row>(table: string, doc: Row): T {
  for (const field of dateFields(table)) {
    const value = doc[field];
    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        doc[field] = date;
      }
    }
  }
  return doc as T;
}

export interface Predicate {
  sql: string;
  params: unknown[];
}

/**
 * WHERE clause matching the rows whose `index` holds any of `keys`, derived
 * from the catalogue entry: single btree with ANY, compound btree with one
 * tuple per key array (a null component never matches, so it is no key),
 * gin with the key function. Parameters are numbered from `offset + 1`.
 */
export function indexPredicate(table: string, index: string, keys: unknown[], offset = 0): Predicate {
  const def = (TABLES[table] ?? []).find((i) => i.name === index);
  if (!def) {
    throw new Error(`postgres: unknown index ${table}.${index}`);
  }
  // `IN ()` is not valid SQL, so an empty key list needs its own clause: FALSE
  // matches nothing, the same result an ANY or && predicate gives on [].
  if (keys.length === 0) {
    return { sql: "FALSE", params: [] };
  }
  if (def.kind === "gin") {
    return { sql: `${pgIndexName(table, index)}(doc) && $${offset + 1}::text[]`, params: [keys.map(String)] };
  }
  if (def.columns.length === 1) {
    return { sql: `${def.columns[0]} = ANY($${offset + 1}::text[])`, params: [keys.map(String)] };
  }
  const params: unknown[] = [];
  const tuples = keys.map((key) => {
    const parts = Array.isArray(key) ? key : [];
    if (parts.length !== def.columns.length) {
      throw new Error(
        `postgres: index ${table}.${index} expects ${def.columns.length} key components, got ${parts.length}`
      );
    }
    const placeholders = parts.map((part) => {
      params.push(part === null || part === undefined ? null : String(part));
      return `$${offset + params.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  return { sql: `(${def.columns.join(", ")}) IN (${tuples.join(", ")})`, params };
}

/**
 * The join form of indexPredicate: SQL that is true when the row's `index`
 * holds the value of `valueSql`, an expression over another relation of the
 * same query (a column reference, never user input). A compound index has no
 * single value to hold, so it is refused.
 */
export function indexHolds(table: string, index: string, valueSql: string): string {
  const def = (TABLES[table] ?? []).find((i) => i.name === index);
  if (!def) {
    throw new Error(`postgres: unknown index ${table}.${index}`);
  }
  if (def.kind === "gin") {
    return `${pgIndexName(table, index)}(doc) @> ARRAY[${valueSql}]`;
  }
  if (def.columns.length !== 1) {
    throw new Error(`postgres: index ${table}.${index} cannot be joined on one value`);
  }
  return `${def.columns[0]} = ${valueSql}`;
}

/**
 * Positional parameters of one statement: add() stores a value and returns
 * its placeholder, so SQL fragments built by different helpers compose into
 * one query without renumbering.
 */
export class Params {
  list: unknown[] = [];

  add(value: unknown): string {
    this.list.push(value);
    return `$${this.list.length}`;
  }

  /** indexPredicate numbered after the parameters already added */
  index(table: string, index: string, keys: unknown[]): string {
    const pred = indexPredicate(table, index, keys, this.list.length);
    this.list.push(...pred.params);
    return pred.sql;
  }
}

/**
 * `x` when it is a JSON array, an empty array otherwise. jsonb_array_elements
 * fails on any other type, and a few legacy documents store an array field as
 * a string; ReQL treats those as "no elements" through typeOf and hasFields
 * guards.
 */
export const arr = (x: string): string => `CASE WHEN jsonb_typeof(${x}) = 'array' THEN ${x} ELSE '[]'::jsonb END`;
