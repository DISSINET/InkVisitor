import { r, Connection, RDatum } from "rethinkdb-ts";
import { Client } from "pg";
import { IndexDef } from "@service/storage/rethink/provision";
import { keysSql, PgIndex } from "@service/storage/postgres/provision";
import { ident } from "../import/targets/postgres";
import { firstDifference } from "./deep-diff";
import { paginate } from "./sources";

export interface KeyedRow {
  id: string;
  keys: unknown;
}

/**
 * [id, keys] per row in id order. `keys` is null when the key function raises
 * on the row, which is exactly the row RethinkDB leaves out of the index; a
 * function that ran and produced nothing yields an empty array instead.
 */
export async function* rethinkKeys(
  conn: Connection,
  table: string,
  index: IndexDef
): AsyncGenerator<KeyedRow> {
  const cursor = await r
    .table(table)
    .orderBy({ index: "id" })
    .map((row: RDatum) => ({
      id: row("id"),
      keys: r.expr(index.keys ? index.keys(row) : row(index.name)).default(null),
    }))
    .getCursor(conn);
  for await (const row of cursor) {
    yield row;
  }
}

export function pgKeys(
  client: Client,
  table: string,
  index: PgIndex
): AsyncGenerator<KeyedRow> {
  return paginate<KeyedRow>(
    client,
    `SELECT id, ${keysSql(table, index)} AS keys FROM ${ident(table)}`
  );
}

/** a key component as a comparable string, a Date as its ISO string */
const text = (key: unknown): string =>
  key instanceof Date ? key.toISOString() : String(key);

/**
 * Keys in a comparable form, with null for "this row has no key": a row
 * RethinkDB skipped and a row PostgreSQL indexed under no key are both
 * unreachable by a lookup.
 *
 * A multi index holds a set of keys, so its array becomes the sorted unique
 * non-null components and an empty one is no key. A key listed twice is the
 * same lookup as a key listed once, which is what a relation between an
 * entity and itself produces on the RethinkDB side.
 *
 * Every other index holds one key, a scalar or a tuple of components in
 * declaration order. A tuple with a missing component is no key: RethinkDB's
 * key function raises a non-existence error on the row and leaves it out of
 * the index, and no PostgreSQL lookup supplies a NULL component to match it.
 */
export function normalizeKeys(keys: unknown, multi: boolean): unknown {
  if (keys === null || keys === undefined) {
    return null;
  }
  if (!Array.isArray(keys)) {
    return text(keys);
  }
  if (multi) {
    const values = [
      ...new Set(keys.filter((k) => k !== null && k !== undefined).map(text)),
    ].sort();
    return values.length ? values : null;
  }
  return keys.some((k) => k === null || k === undefined) ? null : keys.map(text);
}

export interface KeyComparison {
  verdict: "equal" | "lenient" | "differing";
  rethink: unknown;
  postgres: unknown;
}

/**
 * Compares one row's raw keys from both sides, normalised.
 *
 * `lenient` is the one accepted asymmetry: the ReQL key function raised on the
 * document, so RethinkDB holds no key for the row, while the PostgreSQL
 * jsonpath runs in lax mode and indexes whatever it can read. The raw
 * RethinkDB value tells the two apart - null is the `.default(null)` of a
 * function that raised (or a null field), an empty array is a function that
 * ran and legitimately produced no keys, and that one is a real difference.
 */
export function compareKeys(
  rethinkRaw: unknown,
  pgRaw: unknown,
  multi: boolean
): KeyComparison {
  const rethink = normalizeKeys(rethinkRaw, multi);
  const postgres = normalizeKeys(pgRaw, multi);
  if (firstDifference(rethink, postgres) === null) {
    return { verdict: "equal", rethink, postgres };
  }
  const raised = rethinkRaw === null || rethinkRaw === undefined;
  return {
    verdict: raised && postgres !== null ? "lenient" : "differing",
    rethink,
    postgres,
  };
}
