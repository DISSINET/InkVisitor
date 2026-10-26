import { Conn, storage } from "@service/storage";
import { closeTestDb, openTestDb } from "../../../test/db";
import { query } from "./conn";
import { columnClause, COLUMNS } from "./provision";
import { deparsed, syncSchema } from "./schema";

/**
 * syncSchema against the provisioned test database. Every case alters one
 * table's schema and ends with a sync that restores it, so the
 * rest of the run sees the shape ddl() provisions.
 */
const describePg = storage.kind === "postgres" ? describe : describe.skip;

describePg("syncSchema", () => {
  let conn: Conn;
  beforeAll(async () => {
    conn = await openTestDb();
  });
  afterAll(async () => {
    await closeTestDb(conn);
  });

  const exec = (sql: string) => query(conn, sql);
  const generation = async (column: string): Promise<string | null> => {
    const { rows } = await query(
      conn,
      `SELECT generation_expression FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'audits' AND column_name = $1`,
      [column]
    );
    return rows[0]?.generation_expression ?? null;
  };
  const indexdef = async (name: string): Promise<string | null> => {
    const { rows } = await query(conn, "SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1", [name]);
    return rows[0]?.indexdef ?? null;
  };

  it("deparses a path the way PostgreSQL stores the generation expression", () => {
    expect(deparsed("date")).toBe("(doc ->> 'date'::text)");
    expect(deparsed("data.territory.territoryId")).toBe(
      "(((doc -> 'data'::text) -> 'territory'::text) ->> 'territoryId'::text)"
    );
    expect(deparsed({ ids: "entityIds" })).toBe("jsonb_text_array((doc -> 'entityIds'::text))");
    expect(deparsed({ ids: "changes.entityIds" })).toBe("jsonb_text_array(((doc -> 'changes'::text) -> 'entityIds'::text))");
  });

  it("executes nothing on a freshly provisioned database, however often it runs", async () => {
    expect(await syncSchema(conn)).toEqual([]);
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("restores a dropped column and the indexes over it", async () => {
    await exec("DROP INDEX audits_date");
    // takes audits_date_type_user and audits_type_user with it
    await exec("ALTER TABLE audits DROP COLUMN type");
    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE audits ADD COLUMN type text GENERATED ALWAYS AS (doc->>'type') STORED",
      "CREATE INDEX audits_date ON audits (date)",
      `CREATE INDEX audits_date_type_user ON audits (date, type, "user")`,
      `CREATE INDEX audits_type_user ON audits (type, "user")`,
    ]);
    expect(await generation("type")).toBe(deparsed("type"));
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("regenerates a column generated from another expression", async () => {
    await exec(`ALTER TABLE audits DROP COLUMN "user", ADD COLUMN "user" text GENERATED ALWAYS AS (doc->>'userId') STORED`);
    const executed = await syncSchema(conn);
    expect(executed[0]).toBe(
      `ALTER TABLE audits DROP COLUMN "user", ADD COLUMN "user" text GENERATED ALWAYS AS (doc->>'user') STORED`
    );
    expect(await generation("user")).toBe(deparsed("user"));
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("upgrades the expression-index schema to columns", async () => {
    await exec(`ALTER TABLE audits DROP COLUMN date, DROP COLUMN type, DROP COLUMN "user", DROP COLUMN audit_scope, DROP COLUMN model_id`);
    await exec(`CREATE INDEX audits_auditscope_modelid ON audits ((doc->>'auditScope'), (doc->>'modelId'))`);
    await exec(`CREATE INDEX audits_date ON audits ((doc->>'date'))`);
    await exec(`CREATE INDEX audits_date_type_user ON audits ((doc->>'date'), (doc->>'type'), (doc->>'user'))`);

    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE audits " +
        [
          "ADD COLUMN date text GENERATED ALWAYS AS (doc->>'date') STORED",
          "ADD COLUMN type text GENERATED ALWAYS AS (doc->>'type') STORED",
          `ADD COLUMN "user" text GENERATED ALWAYS AS (doc->>'user') STORED`,
          "ADD COLUMN audit_scope text GENERATED ALWAYS AS (doc->>'auditScope') STORED",
          "ADD COLUMN model_id text GENERATED ALWAYS AS (doc->>'modelId') STORED",
        ].join(", "),
      "DROP INDEX audits_auditscope_modelid",
      "CREATE INDEX audits_auditscope_modelid ON audits (audit_scope, model_id)",
      "DROP INDEX audits_date",
      "CREATE INDEX audits_date ON audits (date)",
      "DROP INDEX audits_date_type_user",
      `CREATE INDEX audits_date_type_user ON audits (date, type, "user")`,
      "CREATE INDEX audits_scope_model_date ON audits (audit_scope, model_id, date)",
      `CREATE INDEX audits_type_user ON audits (type, "user")`,
    ]);
    expect(await indexdef("audits_date_type_user")).toBe(
      `CREATE INDEX audits_date_type_user ON public.audits USING btree (date, type, "user")`
    );
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("upgrades the relations key-function gin and type expression index to columns", async () => {
    // takes relations_type and the gin over entity_ids with it
    await exec("ALTER TABLE relations DROP COLUMN type, DROP COLUMN entity_ids");
    await exec(`CREATE INDEX relations_type ON relations ((doc->>'type'))`);
    await exec(
      `CREATE FUNCTION relations_entityids(doc jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY(SELECT jsonb_array_elements_text(doc->'entityIds')) $$`
    );
    await exec("CREATE INDEX relations_entityids ON relations USING gin (relations_entityids(doc))");

    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE relations " +
        [
          "ADD COLUMN type text GENERATED ALWAYS AS (doc->>'type') STORED",
          "ADD COLUMN entity_ids text[] GENERATED ALWAYS AS (jsonb_text_array(doc->'entityIds')) STORED",
        ].join(", "),
      "DROP INDEX relations_entityids",
      "DROP FUNCTION IF EXISTS relations_entityids(jsonb)",
      "CREATE INDEX relations_entityids ON relations USING gin (entity_ids)",
      "DROP INDEX relations_type",
      "CREATE INDEX relations_type ON relations (type)",
    ]);
    expect(await indexdef("relations_entityids")).toBe(
      "CREATE INDEX relations_entityids ON public.relations USING gin (entity_ids)"
    );
    const { rows } = await query(conn, "SELECT to_regprocedure('relations_entityids(jsonb)') AS fn");
    expect(rows[0].fn).toBeNull();
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("upgrades the stats expression indexes to columns", async () => {
    // takes the three btrees over them with it
    await exec("ALTER TABLE stats_materialized_day DROP COLUMN date, DROP COLUMN event_type, DROP COLUMN aggregate_by, DROP COLUMN last_updated");
    await exec(`CREATE INDEX stats_materialized_day_date ON stats_materialized_day ((doc->>'date'))`);
    await exec(`CREATE INDEX stats_materialized_day_lastupdated ON stats_materialized_day ((doc->>'lastUpdated'))`);
    await exec(
      `CREATE INDEX stats_materialized_day_date_eventtype_aggregateby ON stats_materialized_day ((doc->>'date'), (doc->>'eventType'), (doc->>'aggregateBy'))`
    );

    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE stats_materialized_day " +
        Object.entries(COLUMNS.stats_materialized_day)
          .map(([name, spec]) => `ADD COLUMN ${columnClause(name, spec)}`)
          .join(", "),
      "DROP INDEX stats_materialized_day_date",
      "CREATE INDEX stats_materialized_day_date ON stats_materialized_day (date)",
      "DROP INDEX stats_materialized_day_lastupdated",
      "CREATE INDEX stats_materialized_day_lastupdated ON stats_materialized_day (last_updated)",
      "DROP INDEX stats_materialized_day_date_eventtype_aggregateby",
      "CREATE INDEX stats_materialized_day_date_eventtype_aggregateby ON stats_materialized_day (date, event_type, aggregate_by)",
    ]);
    expect(await indexdef("stats_materialized_day_date_eventtype_aggregateby")).toBe(
      "CREATE INDEX stats_materialized_day_date_eventtype_aggregateby ON public.stats_materialized_day USING btree (date, event_type, aggregate_by)"
    );
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("upgrades the audits relation gin from the key function to the entity_ids column", async () => {
    // takes the gin over entity_ids with it
    await exec("ALTER TABLE audits DROP COLUMN entity_ids");
    await exec("CREATE FUNCTION audits_relation_entityids(doc jsonb) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT ARRAY[]::text[] $$");
    await exec("CREATE INDEX audits_relation_entityids ON audits USING gin (audits_relation_entityids(doc))");

    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE audits ADD COLUMN entity_ids text[] GENERATED ALWAYS AS (jsonb_text_array(doc->'changes'->'entityIds')) STORED",
      "DROP INDEX audits_relation_entityids",
      "DROP FUNCTION IF EXISTS audits_relation_entityids(jsonb)",
      "CREATE INDEX audits_relation_entityids ON audits USING gin (entity_ids)",
    ]);
    const { rows } = await query(conn, "SELECT to_regprocedure('audits_relation_entityids(jsonb)') AS fn");
    expect(rows[0].fn).toBeNull();
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("refuses to touch an ordinary column under a declared name", async () => {
    await exec("ALTER TABLE audits DROP COLUMN type");
    await exec("ALTER TABLE audits ADD COLUMN type text");
    try {
      await expect(syncSchema(conn)).rejects.toThrow("audits.type");
    } finally {
      await exec("ALTER TABLE audits DROP COLUMN type");
      await syncSchema(conn);
    }
    expect(await syncSchema(conn)).toEqual([]);
  });
});
