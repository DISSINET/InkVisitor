import { DbEnums } from "@inkvisitor/shared/enums";

/**
 * PostgreSQL mirror of ../rethink/provision.ts: one table per RethinkDB table
 * holding the whole document as jsonb, and one index per RethinkDB secondary
 * index under the same DbEnums.Indexes name. Bodies are hand-written per
 * backend; ../catalogue.test.ts pins both catalogues to the same names.
 *
 * A multi index is an IMMUTABLE function `(doc jsonb) returns text[]` with a
 * GIN index on it, so a lookup is `WHERE fn(doc) && ARRAY[...]`. Every other
 * index is a btree over `doc->>'field'` expressions. Dates live in the
 * document as ISO-8601 UTC strings, which order correctly as text.
 */

export type PgIndex =
  | { name: string; kind: "btree"; columns: string[] }
  | { name: string; kind: "gin"; body: string };

/** SQL identifier shared by an index and, for a multi index, its key function */
export function pgIndexName(table: string, index: string): string {
  return `${table}_${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/**
 * STORED generated columns per table: column name -> the document path it is
 * derived from (dot-separated for a nested field). The column is a copy of
 * the field that an index can cover and a query can read without detoasting
 * the document: `doc` stays the only thing written and the only thing read
 * back, the column follows it. A table listed here declares its btree
 * indexes on these column names, never on `doc->>` expressions, and
 * schema.ts brings a live database to this declaration at every start.
 */
export const COLUMNS: Record<string, Record<string, string>> = {
  audits: { date: "date", type: "type", user: "user", audit_scope: "auditScope", model_id: "modelId" },
  entities: {
    class: "class",
    status: "status",
    language: "language",
    is_template: "isTemplate",
    used_template: "usedTemplate",
    territory_id: "data.territory.territoryId",
    parent_id: "data.parent.territoryId",
    document_id: "data.documentId",
  },
};

/** the SQL expression a generated column is computed from: `doc->'a'->>'b'` for the path `a.b` */
export function columnExpr(path: string): string {
  const parts = path.split(".");
  const last = parts.pop();
  return `doc${parts.map((part) => `->'${part}'`).join("")}->>'${last}'`;
}

/** a generated column as a SQL identifier: `user` is a reserved word, the others are plain */
export const col = (name: string): string => (name === "user" ? `"user"` : name);

const btree = (name: string, ...columns: string[]): PgIndex => ({
  name,
  kind: "btree",
  columns,
});
const gin = (name: string, body: string): PgIndex => ({ name, kind: "gin", body });

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

const entitiesIndexes: PgIndex[] = [
  // props on the entity itself go one level deeper than statement props, as in ReQL
  gin(DbEnums.Indexes.PropsRecursive, collect(propPaths("$.props[*]", 4))),
  gin(
    DbEnums.Indexes.StatementDataProps,
    collect([
      ...propPaths("$.data.actions[*].props[*]", 3),
      ...propPaths("$.data.actants[*].props[*]", 3),
    ])
  ),
  btree(DbEnums.Indexes.Class, "class"),
  btree(DbEnums.Indexes.StatementTerritory, "territory_id"),
  gin(
    DbEnums.Indexes.StatementEntities,
    collect([
      "$.data.actions[*].actionId",
      "$.data.actants[*].entityId",
      "$.data.tags[*]",
      "$.data.territory.territoryId",
    ])
  ),
  btree(DbEnums.Indexes.EntityUsedTemplate, "used_template"),
  // a reference row exists before either side is picked; an empty side is no key
  gin(
    DbEnums.Indexes.EntityReferences,
    collect(["$.references[*].resource", "$.references[*].value"], "v IS NOT NULL AND v <> ''")
  ),
  gin(
    DbEnums.Indexes.StatementActantsCI,
    collect([
      "$.data.actants[*].classifications[*].entityId",
      "$.data.actants[*].identifications[*].entityId",
    ])
  ),
];

// over the generated columns of COLUMNS.audits: the stats aggregation groups
// on date, type and user and is answered from the index alone
const auditsIndexes: PgIndex[] = [
  btree(DbEnums.Indexes.AuditScopeModelId, "audit_scope", "model_id"),
  btree(DbEnums.Indexes.AuditDate, "date"),
  btree(DbEnums.Indexes.AuditDateTypeUser, "date", "type", col("user")),
  gin(DbEnums.Indexes.AuditRelationEntityIds, collect(["$.changes.entityIds[*]"])),
];

const relationsIndexes: PgIndex[] = [
  gin(DbEnums.Indexes.RelationsEntityIds, collect(["$.entityIds[*]"])),
];

const documentsIndexes: PgIndex[] = [
  // entityIds is either the legacy flat string[] or Record<class, string[]>;
  // in strict mode the path for the other shape fails, silently
  gin(DbEnums.Indexes.DocumentEntityIds, collect(["strict $.entityIds[*]", "strict $.entityIds.*[*]"])),
];

const materializedStatsIndexes: PgIndex[] = [
  btree("date", "(doc->>'date')"),
  btree("lastUpdated", "(doc->>'lastUpdated')"),
  btree("date_eventType_aggregateBy", "(doc->>'date')", "(doc->>'eventType')", "(doc->>'aggregateBy')"),
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
  { table: "relations", name: "relations_type", expression: "(doc->>'type')" },
  { table: "entities", name: "entities_territory_parent", expression: "parent_id" },
  { table: "entities", name: "entities_resource_document", expression: "document_id" },
  // the explore base node and the search filter on class and status together
  { table: "entities", name: "entities_class_status", expression: "class, status" },
  // the newest audits of one entity are read straight off the index end
  { table: "audits", name: "audits_scope_model_date", expression: "audit_scope, model_id, date" },
  { table: "audits", name: "audits_type_user", expression: `type, ${col("user")}` },
];

/** the column definition of one generated column, as CREATE TABLE and ADD COLUMN take it */
export const columnClause = (name: string, path: string): string =>
  `${col(name)} text GENERATED ALWAYS AS (${columnExpr(path)}) STORED`;

/** the generated-column clauses of `table`, in COLUMNS order; empty for a table without any */
export function columnClauses(table: string): string[] {
  return Object.entries(COLUMNS[table] ?? {}).map(([name, path]) => columnClause(name, path));
}

/** SQL expression giving a row's key(s) for `index`: text[] for gin, text or text[] for btree */
export function keysSql(table: string, index: PgIndex): string {
  if (index.kind === "gin") {
    return `${pgIndexName(table, index.name)}(doc)`;
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
 * The session table is outside the catalogue (RethinkDB provisions it at boot,
 * see rethink/sessions.ts). Idempotent, so the PG session store runs it on
 * every start and createDatabase runs it for test databases.
 */
export const SESSIONS_DDL = [
  `CREATE TABLE IF NOT EXISTS sessions (doc jsonb NOT NULL, id text GENERATED ALWAYS AS (doc->>'id') STORED PRIMARY KEY)`,
  `CREATE INDEX IF NOT EXISTS sessions_userid ON sessions ((doc->>'userId'))`,
  `CREATE INDEX IF NOT EXISTS sessions_expiresat ON sessions (((doc->>'expiresAt')::bigint))`,
];

/**
 * Every statement that turns an empty database into the full schema, in order,
 * on the assumption that nothing is there yet. An expression index over a
 * user-defined function is not rechecked when the function body is replaced in
 * place, so a changed index function has to be dropped and recreated together
 * with its index, never CREATE OR REPLACEd.
 */
export function ddl(): string[] {
  const statements: string[] = [MERGE_FUNCTION_DDL];
  for (const [table, indexes] of Object.entries(TABLES)) {
    const columns = ["doc jsonb NOT NULL", "id text GENERATED ALWAYS AS (doc->>'id') STORED PRIMARY KEY", ...columnClauses(table)];
    statements.push(`CREATE TABLE ${table} (${columns.join(", ")})`);
    for (const index of indexes) {
      const ident = pgIndexName(table, index.name);
      if (index.kind === "gin") {
        statements.push(
          `CREATE FUNCTION ${ident}(doc jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$\n  ${index.body}\n$$`,
          `CREATE INDEX ${ident} ON ${table} USING gin (${ident}(doc))`
        );
      } else {
        statements.push(`CREATE INDEX ${ident} ON ${table} (${index.columns.join(", ")})`);
      }
    }
  }
  for (const extra of EXTRA_INDEXES) {
    statements.push(`CREATE INDEX ${extra.name} ON ${extra.table} (${extra.expression})`);
  }
  return statements;
}

export async function provision(client: {
  query(sql: string): Promise<unknown>;
}): Promise<void> {
  for (const statement of ddl()) {
    await client.query(statement);
  }
}
