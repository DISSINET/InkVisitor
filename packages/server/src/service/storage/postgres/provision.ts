import { DbEnums } from "@inkvisitor/shared/enums";

/**
 * PostgreSQL mirror of ../rethink/provision.ts: one table per RethinkDB table
 * holding the whole document as jsonb, and one index per RethinkDB secondary
 * index under the same DbEnums.Indexes name. Bodies are hand-written per
 * backend; ../catalogue.test.ts pins both catalogues to the same names.
 *
 * Every index is over generated columns of COLUMNS. A multi index is a GIN
 * index over a text[] column, so a lookup is `WHERE keys && ARRAY[...]`; the
 * column of an index with several key paths is computed by an IMMUTABLE
 * function `(doc jsonb) returns text[]`, since a generation expression cannot
 * hold a subquery. Every other index is a btree. Dates live in the document as
 * ISO-8601 UTC strings, which order correctly as text.
 */

export type PgIndex =
  | { name: string; kind: "btree"; columns: string[] }
  | { name: string; kind: "gin"; column: string };

/** SQL identifier shared by an index and, for a multi index, its key function */
export function pgIndexName(table: string, index: string): string {
  return `${table}_${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/**
 * what a generated column holds: the text of the field at a document path
 * (dot-separated for a nested field), the same text at `ref` with "" stored
 * as NULL (an unset reference, which a foreign key skips), the text[] of the
 * string array at `ids`
 * in document order (an empty array when the field is not an array), or the
 * text[] the IMMUTABLE key function `fn(doc jsonb)` with the SQL `body`
 * returns. A key function exists before its table, and schema.ts drops it
 * together with the columns computed from it when the body changes.
 */
export type ColumnSpec = string | { ref: string } | { ids: string } | KeyFunction;

/** an IMMUTABLE SQL function `fn(doc jsonb) returns text[]` with the body `body` */
type KeyFunction = { fn: string; body: string };

/**
 * Distinct text values found at any of `paths` in the document `doc` (an SQL
 * expression, `doc` for the row's own column). A path runs in lax mode unless
 * it says `strict`; errors are silenced either way, so a document without the
 * field contributes no key, like `.default([])` in ReQL.
 */
export const collect = (paths: string[], where = "v IS NOT NULL", doc = "doc"): string =>
  `SELECT ARRAY(SELECT DISTINCT v FROM jsonb_array_elements_text(\n    ` +
  paths.map((p) => `jsonb_path_query_array(${doc}, '${p}', '{}', true)`).join("\n    || ") +
  `\n  ) AS v WHERE ${where})`;

/**
 * value and type entity ids of every prop under `root`, following `children`
 * `depth` levels down; `kind` keeps one side only
 */
export const propPaths = (root: string, depth: number, kind?: "type" | "value"): string[] => {
  const paths: string[] = [];
  let level = root;
  for (let i = 0; i < depth; i++) {
    if (kind !== "type") paths.push(`${level}.value.entityId`);
    if (kind !== "value") paths.push(`${level}.type.entityId`);
    level = `${level}.children[*]`;
  }
  return paths;
};

/** the keys of the multi index `index` of `table`, computed by the function of the same name */
const keys = (table: string, index: string, body: string): ColumnSpec => ({ fn: pgIndexName(table, index), body });

/**
 * STORED generated columns per table: column name -> what it is derived
 * from. The column is a copy of the field that an index can cover and a query
 * can read without detoasting the document: `doc` stays the only thing
 * written and the only thing read back, the column follows it. A table lists
 * every column its indexes are declared on, so no index is left over a `doc`
 * expression, and schema.ts brings a live database to this declaration at
 * every start.
 */
const MATERIALIZED_STATS_COLUMNS: Record<string, ColumnSpec> = {
  date: "date",
  event_type: "eventType",
  aggregate_by: "aggregateBy",
  last_updated: "lastUpdated",
};

export const COLUMNS: Record<string, Record<string, ColumnSpec>> = {
  audits: {
    date: "date",
    type: "type",
    user: "user",
    audit_scope: "auditScope",
    model_id: "modelId",
    entity_ids: { ids: "changes.entityIds" },
  },
  entities: {
    class: "class",
    status: "status",
    language: "language",
    is_template: "isTemplate",
    used_template: { ref: "usedTemplate" },
    territory_id: { ref: "data.territory.territoryId" },
    parent_id: { ref: "data.parent.territoryId" },
    document_id: { ref: "data.documentId" },
    created_at: "createdAt",
    updated_at: "updatedAt",
    labels: { ids: "labels" },
    // entities carry `labels`, not `label`; the explore label node filters on
    // this field all the same, as RethinkDB does
    label: "label",
    // props on the entity itself go one level deeper than statement props, as in ReQL
    prop_entity_ids: keys("entities", DbEnums.Indexes.PropsRecursive, collect(propPaths("$.props[*]", 4))),
    statement_prop_entity_ids: keys(
      "entities",
      DbEnums.Indexes.StatementDataProps,
      collect([
        ...propPaths("$.data.actions[*].props[*]", 3),
        ...propPaths("$.data.actants[*].props[*]", 3),
      ])
    ),
    statement_entity_ids: keys(
      "entities",
      DbEnums.Indexes.StatementEntities,
      collect([
        "$.data.actions[*].actionId",
        "$.data.actants[*].entityId",
        "$.data.tags[*]",
        "$.data.territory.territoryId",
      ])
    ),
    // a reference row exists before either side is picked; an empty side is no key
    reference_entity_ids: keys(
      "entities",
      DbEnums.Indexes.EntityReferences,
      collect(["$.references[*].resource", "$.references[*].value"], "v IS NOT NULL AND v <> ''")
    ),
    statement_actant_ci_ids: keys(
      "entities",
      DbEnums.Indexes.StatementActantsCI,
      collect([
        "$.data.actants[*].classifications[*].entityId",
        "$.data.actants[*].identifications[*].entityId",
      ])
    ),
  },
  relations: { type: "type", entity_ids: { ids: "entityIds" } },
  users: {
    // "" is no email, so users without one do not collide on the unique constraint
    email: { ref: "email" },
    name: "name",
    role: "role",
    hash: "hash",
    deleted_at: "deletedAt",
    active: "active",
    verified: "verified",
  },
  acl_permissions: { controller: "controller", method: "method", route: "route" },
  settings: { public: "public" },
  saved_queries: { name: "name", owner_id: "ownerId", shared: "shared", created_at: "createdAt", updated_at: "updatedAt" },
  documents: {
    title: "title",
    created_at: "createdAt",
    updated_at: "updatedAt",
    // entityIds is either the legacy flat string[] or Record<class, string[]>;
    // in strict mode the path for the other shape fails, silently
    entity_ids: keys("documents", DbEnums.Indexes.DocumentEntityIds, collect(["strict $.entityIds[*]", "strict $.entityIds.*[*]"])),
  },
  stats_materialized_day: MATERIALIZED_STATS_COLUMNS,
  stats_materialized_week: MATERIALIZED_STATS_COLUMNS,
  stats_materialized_month: MATERIALIZED_STATS_COLUMNS,
  stats_materialized_year: MATERIALIZED_STATS_COLUMNS,
};

/** `doc->'a'->'b'` for the path `a.b`, with `->>` as the last step when `text` */
const pathExpr = (path: string, text: boolean): string => {
  const parts = path.split(".");
  const last = parts.pop();
  return `doc${parts.map((part) => `->'${part}'`).join("")}${text ? "->>" : "->"}'${last}'`;
};

/** the SQL expression a generated column is computed from */
export const columnExpr = (spec: ColumnSpec): string =>
  typeof spec === "string"
    ? pathExpr(spec, true)
    : "ref" in spec
    ? `NULLIF(${pathExpr(spec.ref, true)}, '')`
    : "fn" in spec
    ? `${spec.fn}(doc)`
    : `jsonb_text_array(${pathExpr(spec.ids, false)})`;

export const columnType = (spec: ColumnSpec): string => (typeof spec === "string" || "ref" in spec ? "text" : "text[]");

/** a generated column as a SQL identifier: `user` is a reserved word, the others are plain */
export const col = (name: string): string => (name === "user" ? `"user"` : name);

const btree = (name: string, ...columns: string[]): PgIndex => ({
  name,
  kind: "btree",
  columns,
});
const gin = (name: string, column: string): PgIndex => ({ name, kind: "gin", column });

const entitiesIndexes: PgIndex[] = [
  gin(DbEnums.Indexes.PropsRecursive, "prop_entity_ids"),
  gin(DbEnums.Indexes.StatementDataProps, "statement_prop_entity_ids"),
  btree(DbEnums.Indexes.Class, "class"),
  btree(DbEnums.Indexes.StatementTerritory, "territory_id"),
  gin(DbEnums.Indexes.StatementEntities, "statement_entity_ids"),
  btree(DbEnums.Indexes.EntityUsedTemplate, "used_template"),
  gin(DbEnums.Indexes.EntityReferences, "reference_entity_ids"),
  gin(DbEnums.Indexes.StatementActantsCI, "statement_actant_ci_ids"),
];

// the stats aggregation groups on date, type and user and is answered from
// the index alone
const auditsIndexes: PgIndex[] = [
  btree(DbEnums.Indexes.AuditScopeModelId, "audit_scope", "model_id"),
  btree(DbEnums.Indexes.AuditDate, "date"),
  btree(DbEnums.Indexes.AuditDateTypeUser, "date", "type", col("user")),
  gin(DbEnums.Indexes.AuditRelationEntityIds, "entity_ids"),
];

const relationsIndexes: PgIndex[] = [gin(DbEnums.Indexes.RelationsEntityIds, "entity_ids")];

const documentsIndexes: PgIndex[] = [gin(DbEnums.Indexes.DocumentEntityIds, "entity_ids")];

const materializedStatsIndexes: PgIndex[] = [
  btree("date", "date"),
  btree("lastUpdated", "last_updated"),
  btree("date_eventType_aggregateBy", "date", "event_type", "aggregate_by"),
];

/** Physical table name -> its indexes. Same keys as the RethinkDB catalogue. */
export const TABLES: Record<string, PgIndex[]> = {
  entities: entitiesIndexes,
  relations: relationsIndexes,
  audits: auditsIndexes,
  documents: documentsIndexes,
  users: [],
  acl_permissions: [],
  settings: [],
  saved_queries: [],
  stats_materialized_day: materializedStatsIndexes,
  stats_materialized_week: materializedStatsIndexes,
  stats_materialized_month: materializedStatsIndexes,
  stats_materialized_year: materializedStatsIndexes,
};

/**
 * PostgreSQL-only btree indexes behind the operations RethinkDB runs as
 * unindexed filters. They live outside TABLES so both catalogues keep the
 * same names; a query uses one by repeating its expression verbatim, and
 * assertRequiredIndexes never looks for them. `->>` on a left side that is
 * not an object yields NULL, so a territory whose parent is `false` or a
 * resource without data simply has no key.
 */
export const EXTRA_INDEXES: { table: string; name: string; expression: string }[] = [
  { table: "relations", name: "relations_type", expression: "type" },
  { table: "entities", name: "entities_territory_parent", expression: "parent_id" },
  { table: "entities", name: "entities_resource_document", expression: "document_id" },
  // the explore base node and the search filter on class and status together
  { table: "entities", name: "entities_class_status", expression: "class, status" },
  // the newest audits of one entity are read straight off the index end
  { table: "audits", name: "audits_scope_model_date", expression: "audit_scope, model_id, date" },
  { table: "audits", name: "audits_type_user", expression: `type, ${col("user")}` },
  { table: "users", name: "users_email", expression: "email" },
  { table: "saved_queries", name: "saved_queries_owner", expression: "owner_id" },
  { table: "acl_permissions", name: "acl_permissions_route", expression: "controller, method, route" },
];

/**
 * Constraints over generated columns, each backing up a check the models make
 * before a save: a foreign key references the `id` of a table whose rows the
 * models guard (a territory with children or statements is not deleted, users
 * are soft-deleted), and PostgreSQL takes only NO ACTION or RESTRICT on a
 * generated column; a unique constraint closes the read-then-write gap of the
 * model's duplicate check. A loader that inserts rows in an arbitrary order
 * provisions with ddl(false) and adds these after the load.
 */
export type Constraint = { table: string; name: string } & (
  | { kind: "foreign key"; column: string; references: string }
  | { kind: "unique"; columns: string[] }
);

export const CONSTRAINTS: Constraint[] = [
  { table: "entities", name: "entities_territory_id_fkey", kind: "foreign key", column: "territory_id", references: "entities" },
  { table: "entities", name: "entities_parent_id_fkey", kind: "foreign key", column: "parent_id", references: "entities" },
  { table: "audits", name: "audits_user_fkey", kind: "foreign key", column: "user", references: "users" },
  { table: "saved_queries", name: "saved_queries_owner_id_fkey", kind: "foreign key", column: "owner_id", references: "users" },
  // Relation.beforeSave forbids a second relation over the same two entities;
  // a SYN relation holds a set of any size, which the model compares as a set
  // and this constraint only in document order
  { table: "relations", name: "relations_type_entity_ids_key", kind: "unique", columns: ["type", "entity_ids"] },
  // User.findByLogin keeps the email unique across trashed users too
  { table: "users", name: "users_email_key", kind: "unique", columns: ["email"] },
  { table: "acl_permissions", name: "acl_permissions_route_key", kind: "unique", columns: ["controller", "method", "route"] },
];

/** the constraint definition, exactly as pg_get_constraintdef prints it back */
export const constraintDef = (c: Constraint): string =>
  c.kind === "foreign key"
    ? `FOREIGN KEY (${col(c.column)}) REFERENCES ${c.references}(id) ON DELETE RESTRICT`
    : `UNIQUE (${c.columns.map(col).join(", ")})`;

export const constraintDdl = (c: Constraint): string => `ALTER TABLE ${c.table} ADD CONSTRAINT ${c.name} ${constraintDef(c)}`;

/**
 * One row of `c.table` the constraint would reject, as `id` and the offending
 * `value`; no row when it holds. A NULL never violates either kind.
 */
export const violationSql = (c: Constraint): string => {
  if (c.kind === "foreign key") {
    return (
      `SELECT c.id, c.${col(c.column)} AS value FROM ${c.table} c ` +
      `WHERE c.${col(c.column)} IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ${c.references} r WHERE r.id = c.${col(c.column)}) LIMIT 1`
    );
  }
  const columns = c.columns.map(col).join(", ");
  return (
    `SELECT min(id) AS id, ROW(${columns})::text AS value FROM ${c.table} ` +
    `WHERE ${c.columns.map((column) => `${col(column)} IS NOT NULL`).join(" AND ")} ` +
    `GROUP BY ${columns} HAVING count(*) > 1 LIMIT 1`
  );
};

const violationMessage = (c: Constraint, row: { id: string; value: string }): string =>
  c.kind === "foreign key"
    ? `cannot add the foreign key ${c.name}: ${c.table} row ${row.id} has ${c.column} = ${row.value}, ` +
      `which is not an id in ${c.references}. Fix or delete the dangling rows first.`
    : `cannot add the constraint ${c.name}: ${c.table} row ${row.id} shares (${c.columns.join(", ")}) = ${row.value} ` +
      `with another row. Fix or delete the duplicate rows first.`;

/**
 * Adds the constraints, failing on the first one the data violates, named
 * with one offending row so the data can be fixed by hand.
 */
export async function addConstraints(
  client: { query(sql: string): Promise<{ rows: any[] }> },
  constraints = CONSTRAINTS
): Promise<string[]> {
  const executed: string[] = [];
  for (const c of constraints) {
    const { rows } = await client.query(violationSql(c));
    if (rows.length) {
      throw new Error(violationMessage(c, rows[0]));
    }
    const statement = constraintDdl(c);
    await client.query(statement);
    executed.push(statement);
  }
  return executed;
}

/** the column definition of one generated column, as CREATE TABLE and ADD COLUMN take it */
export const columnClause = (name: string, spec: ColumnSpec): string =>
  `${col(name)} ${columnType(spec)} GENERATED ALWAYS AS (${columnExpr(spec)}) STORED`;

/** the generated-column clauses of `table`, in COLUMNS order; empty for a table without any */
export function columnClauses(table: string): string[] {
  return Object.entries(COLUMNS[table] ?? {}).map(([name, spec]) => columnClause(name, spec));
}

/** the key functions the columns of `table` are computed from, in COLUMNS order */
export function keyFunctions(table: string): KeyFunction[] {
  return Object.values(COLUMNS[table] ?? {}).filter((spec): spec is KeyFunction => typeof spec !== "string" && "fn" in spec);
}

/**
 * CREATE FUNCTION of a key function. A generated column depends on it, so a
 * changed body is never CREATE OR REPLACEd in place: the stored values would
 * keep the old keys. schema.ts drops the function with its columns and
 * recreates both.
 */
export const keyFunctionDdl = ({ fn, body }: KeyFunction): string =>
  `CREATE FUNCTION ${fn}(doc jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$\n  ${body}\n$$`;

/** SQL expression giving a row's key(s) for `index`: text[] for gin, text or text[] for btree */
export function keysSql(table: string, index: PgIndex): string {
  if (index.kind === "gin") {
    return index.column;
  }
  return index.columns.length === 1
    ? index.columns[0]
    : `ARRAY[${index.columns.join(", ")}]`;
}

/**
 * ReQL `update` semantics inside the database: when both sides are objects
 * their keys merge recursively, a key absent from `b` keeps `a`'s value, a JSON
 * null in `b` sets null, and arrays and scalars in `b` replace whatever `a`
 * had. plpgsql because a SQL function cannot call itself. No index depends on
 * it, so CREATE OR REPLACE is the right way to change it.
 */
export const MERGE_FUNCTION_DDL = `CREATE OR REPLACE FUNCTION jsonb_deep_merge(a jsonb, b jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF jsonb_typeof(a) <> 'object' OR jsonb_typeof(b) <> 'object' THEN
    RETURN b;
  END IF;
  RETURN (
    SELECT coalesce(jsonb_object_agg(k, CASE
        WHEN av IS NULL THEN bv
        WHEN bv IS NULL THEN av
        ELSE jsonb_deep_merge(av, bv) END), '{}'::jsonb)
    FROM (
      SELECT coalesce(x.k, y.k) AS k, x.v AS av, y.v AS bv
      FROM jsonb_each(a) AS x(k, v)
      FULL JOIN jsonb_each(b) AS y(k, v) ON x.k = y.k
    ) s);
END $$`;

/**
 * The elements of a JSON array of strings as text[], in order; an empty array
 * for any other JSON type, as `.default([])` in ReQL. The `ids` columns of
 * COLUMNS are generated from it, which is what makes it IMMUTABLE and what a
 * change of its body would not recompute: the body never changes.
 */
export const TEXT_ARRAY_FUNCTION_DDL = `CREATE OR REPLACE FUNCTION jsonb_text_array(x jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY(SELECT v FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(x) = 'array' THEN x ELSE '[]'::jsonb END) WITH ORDINALITY AS t(v, i) ORDER BY i)
$$`;

/** the channel the change triggers notify on and invalidation.ts listens to */
export const CHANGES_CHANNEL = "inkvisitor_changes";

/**
 * The tables storage.watch follows. A write to one of them, from any session,
 * sends `table:id` on CHANGES_CHANNEL once its transaction commits, and a
 * TRUNCATE sends `table`. Every row a write touches pays for a notification,
 * so a table nothing watches has no trigger.
 */
export const NOTIFY_TABLES = ["users", "settings"];

/**
 * Row-level, so each payload carries one id and stays far under the 8000-byte
 * NOTIFY limit whatever the size of the write; NOTIFY folds equal payloads of
 * one transaction into one. coalesce(OLD.id, NEW.id) is the id a cache knows
 * the row by, and is NULL in the TRUNCATE trigger. pg_notify refuses a payload
 * of 8000 bytes or more, which would fail the write, so an id that long is
 * sent as a clear.
 */
export const NOTIFY_FUNCTION_DDL = `CREATE OR REPLACE FUNCTION notify_change() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  payload text := TG_TABLE_NAME || coalesce(':' || coalesce(OLD.id, NEW.id), '');
BEGIN
  PERFORM pg_notify('${CHANGES_CHANNEL}', CASE WHEN octet_length(payload) < 8000 THEN payload ELSE TG_TABLE_NAME END);
  RETURN NULL;
END $$`;

/** the triggers of a NOTIFY_TABLES table, by name; TRUNCATE takes only a statement trigger */
export const notifyTriggers = (table: string): { name: string; ddl: string }[] =>
  [
    { name: `${table}_notify_change`, on: "INSERT OR UPDATE OR DELETE", each: "ROW" },
    { name: `${table}_notify_truncate`, on: "TRUNCATE", each: "STATEMENT" },
  ].map(({ name, on, each }) => ({
    name,
    ddl: `CREATE TRIGGER ${name} AFTER ${on} ON ${table} FOR EACH ${each} EXECUTE FUNCTION notify_change()`,
  }));

const SESSION_COLUMNS = [
  `user_id text GENERATED ALWAYS AS (doc->>'userId') STORED`,
  // an epoch-ms timestamp
  `expires_at bigint GENERATED ALWAYS AS ((doc->>'expiresAt')::bigint) STORED`,
];

/**
 * The session table is outside the catalogue (RethinkDB provisions it at boot,
 * see rethink/sessions.ts), so its columns and indexes are declared here and
 * not synced by schema.ts. Idempotent, so the PG session store runs it on
 * every start and createDatabase runs it for test databases. A database from
 * before the columns has the two indexes over `doc` expressions under the
 * dropped names. ALTER TABLE locks the table before it checks IF NOT EXISTS,
 * so the columns are added behind a catalogue lookup.
 */
export const SESSIONS_DDL = [
  `CREATE TABLE IF NOT EXISTS sessions (doc jsonb NOT NULL, id text GENERATED ALWAYS AS (doc->>'id') STORED PRIMARY KEY, ${SESSION_COLUMNS.join(", ")})`,
  `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'expires_at') THEN
    ALTER TABLE sessions ${SESSION_COLUMNS.map((column) => `ADD COLUMN ${column}`).join(", ")};
  END IF;
END $$`,
  `DROP INDEX IF EXISTS sessions_userid, sessions_expiresat`,
  `CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions (expires_at)`,
];

/**
 * Every statement that turns an empty database into the full schema, in order,
 * on the assumption that nothing is there yet; without the constraints when
 * `constraints` is false.
 */
export function ddl(constraints = true): string[] {
  const statements: string[] = [MERGE_FUNCTION_DDL, TEXT_ARRAY_FUNCTION_DDL, NOTIFY_FUNCTION_DDL];
  for (const [table, indexes] of Object.entries(TABLES)) {
    statements.push(...keyFunctions(table).map(keyFunctionDdl));
    const columns = ["doc jsonb NOT NULL", "id text GENERATED ALWAYS AS (doc->>'id') STORED PRIMARY KEY", ...columnClauses(table)];
    statements.push(`CREATE TABLE ${table} (${columns.join(", ")})`);
    if (NOTIFY_TABLES.includes(table)) statements.push(...notifyTriggers(table).map((trigger) => trigger.ddl));
    for (const index of indexes) {
      const ident = pgIndexName(table, index.name);
      if (index.kind === "gin") {
        statements.push(`CREATE INDEX ${ident} ON ${table} USING gin (${index.column})`);
      } else {
        statements.push(`CREATE INDEX ${ident} ON ${table} (${index.columns.join(", ")})`);
      }
    }
  }
  for (const extra of EXTRA_INDEXES) {
    statements.push(`CREATE INDEX ${extra.name} ON ${extra.table} (${extra.expression})`);
  }
  if (constraints) statements.push(...CONSTRAINTS.map(constraintDdl));
  return statements;
}

export async function provision(
  client: {
    query(sql: string): Promise<unknown>;
  },
  constraints = true
): Promise<void> {
  for (const statement of ddl(constraints)) {
    await client.query(statement);
  }
}
