import { Conn } from "../types";
import { query } from "./conn";
import { COLUMNS, ColumnSpec, EXTRA_INDEXES, TABLES, TEXT_ARRAY_FUNCTION_DDL, col, columnClause, pgIndexName } from "./provision";

/**
 * Brings a live database to the generated columns of COLUMNS and the btree
 * indexes over them, so a database provisioned by an older ddl() is upgraded
 * in place at server start. Returns the DDL it executed, empty when the
 * database already matches.
 *
 * Only what a table in COLUMNS declares on plain columns is managed here: the
 * key-function gin indexes and the expression indexes of other tables are
 * created by ddl() alone and verified by name through REQUIRED.
 *
 * Each statement autocommits on its own, so a sync interrupted by a crash
 * resumes from where it stopped. ADD COLUMN ... STORED rewrites the table
 * under an exclusive lock, which is why every column change of one table goes
 * into a single ALTER TABLE.
 */
export async function syncSchema(conn: Conn): Promise<string[]> {
  // session-level, so it spans the separate DDL statements; two server
  // instances starting together run the sync one after the other
  await query(conn, "SELECT pg_advisory_lock($1)", [SCHEMA_LOCK_KEY]);
  try {
    // an `ids` column is generated from it, so it exists before any ALTER
    await query(conn, TEXT_ARRAY_FUNCTION_DDL);
    const executed: string[] = [];
    const run = async (statement: string) => {
      console.log("[startup] schema: " + statement);
      await query(conn, statement);
      executed.push(statement);
    };
    for (const table of Object.keys(COLUMNS)) {
      const alter = await columnChanges(conn, table);
      if (alter.length) {
        await run(`ALTER TABLE ${table} ${alter.join(", ")}`);
      }
      // read after the ALTER: dropping a column drops the indexes over it
      for (const statement of await indexChanges(conn, table)) {
        await run(statement);
      }
    }
    if (!executed.length) {
      console.log("[startup] schema in sync");
    }
    return executed;
  } finally {
    await query(conn, "SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK_KEY]);
  }
}

/** any constant no other code in the database takes an advisory lock on */
const SCHEMA_LOCK_KEY = 33340001;

/**
 * information_schema.columns.generation_expression of a column generated from
 * columnExpr(spec): PostgreSQL stores the expression deparsed, with every
 * operator parenthesised and every key cast, e.g. `a.b` becomes
 * `((doc -> 'a'::text) ->> 'b'::text)` and `{ ids: "a" }` becomes
 * `jsonb_text_array((doc -> 'a'::text))`
 */
export function deparsed(spec: ColumnSpec): string {
  const parts = (typeof spec === "string" ? spec : spec.ids).split(".");
  const last = parts.pop();
  const object = parts.reduce((acc, part) => `(${acc} -> '${part}'::text)`, "doc");
  return typeof spec === "string" ? `(${object} ->> '${last}'::text)` : `jsonb_text_array((${object} -> '${last}'::text))`;
}

/** DROP/ADD COLUMN clauses that turn the live columns of `table` into COLUMNS[table] */
async function columnChanges(conn: Conn, table: string): Promise<string[]> {
  const { rows } = await query<{ column_name: string; is_generated: string; generation_expression: string | null }>(
    conn,
    `SELECT column_name, is_generated, generation_expression FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  const live = new Map(rows.map((row) => [row.column_name, row]));
  const drops: string[] = [];
  const adds: string[] = [];
  for (const [name, spec] of Object.entries(COLUMNS[table])) {
    const current = live.get(name);
    if (current && current.is_generated !== "ALWAYS") {
      throw new Error(
        `[startup] ${table}.${name} is a column the schema declares as generated, but the database has it as an ` +
          `ordinary column. The schema sync never touches such a column: rename or drop it by hand and restart.`
      );
    }
    if (current?.generation_expression === deparsed(spec)) continue;
    if (current) drops.push(`DROP COLUMN ${col(name)}`);
    adds.push(`ADD COLUMN ${columnClause(name, spec)}`);
  }
  return [...drops, ...adds];
}

type DeclaredIndex = { name: string; method: "btree" | "gin"; columns: string[] };

/** indexes over plain columns that `table` declares in TABLES and EXTRA_INDEXES */
function declaredIndexes(table: string): DeclaredIndex[] {
  const declared: DeclaredIndex[] = [];
  for (const index of TABLES[table]) {
    const name = pgIndexName(table, index.name);
    if (index.kind === "btree") declared.push({ name, method: "btree", columns: index.columns });
    else if ("column" in index) declared.push({ name, method: "gin", columns: [index.column] });
  }
  for (const extra of EXTRA_INDEXES) {
    if (extra.table === table) {
      declared.push({ name: extra.name, method: "btree", columns: extra.expression.split(",").map((c) => c.trim()) });
    }
  }
  return declared;
}

/**
 * DROP/CREATE INDEX statements for the declared indexes of `table` that are
 * missing or differ from the declaration. Compared on the catalogue structure,
 * not on indexdef text: a plain index of the declared method on `table` whose
 * key columns are the declared ones, in order. A gin index found over a key
 * function is replaced, and the function, which only that index used, goes
 * with it.
 */
async function indexChanges(conn: Conn, table: string): Promise<string[]> {
  const declared = declaredIndexes(table);
  const { rows } = await query<{ name: string; tablename: string; method: string; plain: boolean; columns: string[] }>(
    conn,
    `SELECT i.relname AS name, t.relname AS tablename, am.amname AS method,
            x.indexprs IS NULL AND x.indpred IS NULL AS plain,
            ARRAY(SELECT a.attname::text
                  FROM unnest(x.indkey) WITH ORDINALITY AS k(attnum, ord)
                  JOIN pg_attribute a ON a.attrelid = x.indrelid AND a.attnum = k.attnum
                  ORDER BY k.ord) AS columns
     FROM pg_index x
     JOIN pg_class i ON i.oid = x.indexrelid
     JOIN pg_class t ON t.oid = x.indrelid
     JOIN pg_am am ON am.oid = i.relam
     WHERE i.relnamespace = 'public'::regnamespace AND i.relname = ANY($1)`,
    [declared.map((index) => index.name)]
  );
  const live = new Map(rows.map((row) => [row.name, row]));
  const unquote = (name: string) => name.replace(/^"(.*)"$/, "$1");
  const statements: string[] = [];
  for (const index of declared) {
    const current = live.get(index.name);
    const matches =
      current?.tablename === table &&
      current.method === index.method &&
      current.plain &&
      current.columns.join(",") === index.columns.map(unquote).join(",");
    if (matches) continue;
    if (current) statements.push(`DROP INDEX ${index.name}`);
    if (current && index.method === "gin") statements.push(`DROP FUNCTION IF EXISTS ${index.name}(jsonb)`);
    const using = index.method === "gin" ? "USING gin " : "";
    statements.push(`CREATE INDEX ${index.name} ON ${table} ${using}(${index.columns.join(", ")})`);
  }
  return statements;
}
