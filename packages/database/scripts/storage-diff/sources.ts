import { r, Connection } from "rethinkdb-ts";
import { Client } from "pg";
import { ident } from "../import/targets/postgres";

export interface Row {
  id: string;
  doc: Record<string, unknown>;
}

export interface Keyed {
  id: string;
}

const PAGE = 5000;

/** rows in primary-key order; RethinkDB orders strings by code point */
export async function* rethinkRows(
  conn: Connection,
  table: string
): AsyncGenerator<Row> {
  const cursor = await r.table(table).orderBy({ index: "id" }).getCursor(conn);
  for await (const doc of cursor) {
    yield { id: doc.id, doc };
  }
}

/**
 * Rows of `select` - a `SELECT <columns> FROM <table>` prefix whose columns
 * include `id` - in primary-key order by keyset pagination. The database is
 * created with a code-point collation, so this order matches RethinkDB's.
 */
export async function* paginate<T extends Keyed>(
  client: Client,
  select: string
): AsyncGenerator<T> {
  let after = "";
  for (;;) {
    const { rows } = await client.query(
      `${select} WHERE id > $1 ORDER BY id LIMIT ${PAGE}`,
      [after]
    );
    for (const row of rows) {
      yield row;
    }
    if (rows.length < PAGE) {
      return;
    }
    after = rows[rows.length - 1].id;
  }
}

export function pgRows(client: Client, table: string): AsyncGenerator<Row> {
  return paginate<Row>(client, `SELECT id, doc FROM ${ident(table)}`);
}

/**
 * Walks two id-sorted streams together. Ids compare as JS strings, which is
 * code point order for the ASCII ids in use and what both databases sort by.
 */
export async function mergeById<A extends Keyed, B extends Keyed>(
  left: AsyncGenerator<A>,
  right: AsyncGenerator<B>,
  on: {
    both(a: A, b: B): void;
    leftOnly(a: A): void;
    rightOnly(b: B): void;
  }
): Promise<void> {
  let a = await left.next();
  let b = await right.next();
  while (!a.done || !b.done) {
    if (b.done || (!a.done && a.value.id < b.value.id)) {
      on.leftOnly(a.value as A);
      a = await left.next();
    } else if (a.done || b.value.id < a.value.id) {
      on.rightOnly(b.value as B);
      b = await right.next();
    } else {
      on.both(a.value as A, b.value as B);
      a = await left.next();
      b = await right.next();
    }
  }
}
