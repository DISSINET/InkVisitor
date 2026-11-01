import { Conn } from "../types";
import { query } from "./conn";
import {
  COLUMNS,
  ColumnSpec,
  CONSTRAINTS,
  Constraint,
  EXTRA_INDEXES,
  NOTIFY_FUNCTION_DDL,
  NOTIFY_TABLES,
  TABLES,
  TEXT_ARRAY_FUNCTION_DDL,
  addConstraints,
  columnClause,
  constraintDef,
  keyFunctionDdl,
  keyFunctions,
  notifyTriggers,
  pgIndexName,
} from "./provision";

/**
 * Brings a live database to the key functions and generated columns of
 * COLUMNS, the indexes over them, the CONSTRAINTS over those columns and the
 * change triggers of NOTIFY_TABLES, so a database provisioned by an older
 * ddl() is upgraded in place at server start. Returns the DDL it executed,
 * empty when the database already matches.
 *
 * Per table, in dependency order: a key function whose body differs goes
 * first, dropped with everything computed from it (its columns, and the
 * expression index an older ddl() built over the function) and recreated;
 * then the columns, which a dropped function leaves missing; then the
 * indexes, which a dropped column leaves missing.
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
      for (const statement of await functionChanges(conn, table)) {
        await run(statement);
      }
      const alter = await columnChanges(conn, table);
      if (alter.length) {
        await run(`ALTER TABLE ${table} ${alter.join(", ")}`);
      }
      // read after the ALTER: dropping a column drops the indexes over it
      for (const statement of await indexChanges(conn, table)) {
        await run(statement);
      }
    }
    // after every table: a recreated column has lost the constraints over it
    const { drops, missing } = await constraintChanges(conn);
    for (const statement of drops) {
      await run(statement);
    }
    if (missing.length) {
      console.log("[startup] schema: adding constraints " + missing.map((c) => c.name).join(", "));
      executed.push(...(await addConstraints({ query: (sql) => query(conn, sql) }, missing)));
    }
    // the triggers call it, and CREATE OR REPLACE keeps them attached
    await query(conn, NOTIFY_FUNCTION_DDL);
    for (const statement of await triggerChanges(conn)) {
      await run(statement);
    }
    if (!executed.length) {
      console.log("[startup] schema in sync");
    }
    return executed;
  } finally {
    await query(conn, "SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK_KEY]);
  }
}

/**
 * The declared constraints that are missing, and DROP CONSTRAINT for those
 * whose live definition differs (including one left NOT VALID), which then
 * count as missing too.
 */
async function constraintChanges(conn: Conn): Promise<{ drops: string[]; missing: Constraint[] }> {
  const { rows } = await query<{ name: string; tablename: string; def: string }>(
    conn,
    `SELECT conname AS name, conrelid::regclass::text AS tablename, pg_get_constraintdef(oid) AS def
     FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conname = ANY($1)`,
    [CONSTRAINTS.map((c) => c.name)]
  );
  const live = new Map(rows.map((row) => [row.name, row]));
  const drops: string[] = [];
  const missing: Constraint[] = [];
  for (const c of CONSTRAINTS) {
    const current = live.get(c.name);
    if (current?.tablename === c.table && current.def === constraintDef(c)) continue;
    if (current) drops.push(`ALTER TABLE ${current.tablename} DROP CONSTRAINT ${c.name}`);
    missing.push(c);
  }
  return { drops, missing };
}

/** CREATE TRIGGER for each declared change trigger that is missing */
async function triggerChanges(conn: Conn): Promise<string[]> {
  const declared = ([] as { name: string; ddl: string }[]).concat(...NOTIFY_TABLES.map(notifyTriggers));
  const { rows } = await query<{ name: string }>(
    conn,
    `SELECT tgname AS name FROM pg_trigger
     WHERE NOT tgisinternal AND tgname = ANY($1) AND tgrelid = ANY($2::text[]::regclass[])`,
    [declared.map((trigger) => trigger.name), NOTIFY_TABLES.map((table) => `public.${table}`)]
  );
  const present = new Set(rows.map((row) => row.name));
  return declared.filter((trigger) => !present.has(trigger.name)).map((trigger) => trigger.ddl);
}

/** any constant no other code in the database takes an advisory lock on */
const SCHEMA_LOCK_KEY = 33340001;

/**
 * information_schema.columns.generation_expression of a column generated from
 * columnExpr(spec): PostgreSQL stores the expression deparsed, with every
 * operator parenthesised and every key cast, e.g. `a.b` becomes
 * `((doc -> 'a'::text) ->> 'b'::text)` and `{ ids: "a" }` becomes
 * `jsonb_text_array((doc -> 'a'::text))`; `{ ref: "a" }` becomes
 * `NULLIF((doc ->> 'a'::text), ''::text)`; `{ bool: "a" }` becomes
 * `COALESCE(((doc -> 'a'::text) = 'true'::jsonb), false)`; a key function call
 * stays `fn(doc)`
 */
export function deparsed(spec: ColumnSpec): string {
  if (typeof spec !== "string" && "fn" in spec) return `${spec.fn}(doc)`;
  if (typeof spec !== "string" && "ref" in spec) return `NULLIF(${deparsed(spec.ref)}, ''::text)`;
  const parts = (typeof spec === "string" ? spec : "bool" in spec ? spec.bool : spec.ids).split(".");
  const last = parts.pop();
  const object = parts.reduce((acc, part) => `(${acc} -> '${part}'::text)`, "doc");
  if (typeof spec === "string") return `(${object} ->> '${last}'::text)`;
  const value = `(${object} -> '${last}'::text)`;
  return "bool" in spec ? `COALESCE((${value} = 'true'::jsonb), false)` : `jsonb_text_array(${value})`;
}

/**
 * CREATE FUNCTION statements for the key functions of `table` that are missing
 * or whose live body differs from the declared one. pg_proc.prosrc holds a SQL
 * function body verbatim, so the comparison is on the text. CASCADE takes
 * everything computed from the function with it, the generated columns and
 * any index over the function included; the column and index syncs that
 * follow put the declared ones back.
 */
async function functionChanges(conn: Conn, table: string): Promise<string[]> {
  const statements: string[] = [];
  for (const key of keyFunctions(table)) {
    const { rows } = await query<{ prosrc: string }>(conn, "SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure($1)", [`${key.fn}(jsonb)`]);
    if (rows.length && rows[0].prosrc.trim() === key.body.trim()) continue;
    if (rows.length) statements.push(`DROP FUNCTION ${key.fn}(jsonb) CASCADE`);
    statements.push(keyFunctionDdl(key));
  }
  return statements;
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
    if (current) drops.push(`DROP COLUMN ${name}`);
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
    else declared.push({ name, method: "gin", columns: [index.column] });
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
 * function is replaced; a function that no declared column is computed from
 * was used by that index alone and goes with it.
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
  const keyFns = new Set(keyFunctions(table).map((key) => key.fn));
  const statements: string[] = [];
  for (const index of declared) {
    const current = live.get(index.name);
    const matches =
      current?.tablename === table &&
      current.method === index.method &&
      current.plain &&
      current.columns.join(",") === index.columns.join(",");
    if (matches) continue;
    if (current) statements.push(`DROP INDEX ${index.name}`);
    if (current && index.method === "gin" && !keyFns.has(index.name)) statements.push(`DROP FUNCTION IF EXISTS ${index.name}(jsonb)`);
    const using = index.method === "gin" ? "USING gin " : "";
    statements.push(`CREATE INDEX ${index.name} ON ${table} ${using}(${index.columns.join(", ")})`);
  }
  return statements;
}
