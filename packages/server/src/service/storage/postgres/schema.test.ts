import { Conn, storage } from "@service/storage";
import { closeTestDb, openTestDb } from "../../../test/db";
import { query } from "./conn";
import {
  columnClause,
  COLUMNS,
  CONSTRAINTS,
  constraintDdl,
  keyFunctionDdl,
  keyFunctions,
  notifyTriggers,
  SESSIONS_DDL,
} from "./provision";
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
  const generation = async (column: string, table = "audits"): Promise<string | null> => {
    const { rows } = await query(
      conn,
      `SELECT generation_expression FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $2 AND column_name = $1`,
      [column, table]
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
    expect(deparsed({ ref: "data.territory.territoryId" })).toBe(
      "NULLIF((((doc -> 'data'::text) -> 'territory'::text) ->> 'territoryId'::text), ''::text)"
    );
    expect(deparsed({ ids: "entityIds" })).toBe("jsonb_text_array((doc -> 'entityIds'::text))");
    expect(deparsed({ ids: "changes.entityIds" })).toBe("jsonb_text_array(((doc -> 'changes'::text) -> 'entityIds'::text))");
    expect(deparsed({ fn: "documents_entityids", body: "SELECT ARRAY[]::text[]" })).toBe("documents_entityids(doc)");
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
      // dropping the column took the foreign key over it
      `ALTER TABLE audits ADD CONSTRAINT audits_user_fkey FOREIGN KEY ("user") REFERENCES users(id) ON DELETE RESTRICT`,
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
      // dropping the columns took the unique constraint over them
      "ALTER TABLE relations ADD CONSTRAINT relations_type_entity_ids_key UNIQUE (type, entity_ids)",
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

  it("moves the entities key-function gin onto the column and keeps the function the column needs", async () => {
    // takes the gin over prop_entity_ids with it
    await exec("ALTER TABLE entities DROP COLUMN prop_entity_ids");
    await exec("CREATE INDEX entities_props_recursive ON entities USING gin (entities_props_recursive(doc))");

    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE entities ADD COLUMN prop_entity_ids text[] GENERATED ALWAYS AS (entities_props_recursive(doc)) STORED",
      "DROP INDEX entities_props_recursive",
      "CREATE INDEX entities_props_recursive ON entities USING gin (prop_entity_ids)",
    ]);
    expect(await generation("prop_entity_ids", "entities")).toBe("entities_props_recursive(doc)");
    expect(await indexdef("entities_props_recursive")).toBe(
      "CREATE INDEX entities_props_recursive ON public.entities USING gin (prop_entity_ids)"
    );
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("recreates a key function whose body changed, then the column and the index computed from it", async () => {
    const [key] = keyFunctions("documents");
    // the database of an older ddl(): the function with another body, the
    // index over the function and the column over the function
    await exec("DROP FUNCTION documents_entityids(jsonb) CASCADE");
    await exec(keyFunctionDdl({ ...key, body: "SELECT ARRAY[]::text[]" }));
    await exec("CREATE INDEX documents_entityids ON documents USING gin (documents_entityids(doc))");
    await exec("ALTER TABLE documents ADD COLUMN entity_ids text[] GENERATED ALWAYS AS (documents_entityids(doc)) STORED");
    await exec(`INSERT INTO documents (doc) VALUES ('{"id": "schema-test-doc", "entityIds": ["schema-test-entity"]}')`);
    try {
      expect(await syncSchema(conn)).toEqual([
        "DROP FUNCTION documents_entityids(jsonb) CASCADE",
        keyFunctionDdl(key),
        "ALTER TABLE documents ADD COLUMN entity_ids text[] GENERATED ALWAYS AS (documents_entityids(doc)) STORED",
        "CREATE INDEX documents_entityids ON documents USING gin (entity_ids)",
      ]);
      // the stored keys are the ones of the declared body
      const { rows } = await query(conn, "SELECT entity_ids FROM documents WHERE id = 'schema-test-doc'");
      expect(rows[0].entity_ids).toEqual(["schema-test-entity"]);
      expect(await indexdef("documents_entityids")).toBe("CREATE INDEX documents_entityids ON public.documents USING gin (entity_ids)");
      expect(await syncSchema(conn)).toEqual([]);
    } finally {
      await exec("DELETE FROM documents WHERE id = 'schema-test-doc'");
    }
  });

  it("resumes after a crash between the dropped function and its recreation", async () => {
    await exec("DROP FUNCTION documents_entityids(jsonb) CASCADE");
    expect(await syncSchema(conn)).toEqual([
      keyFunctionDdl(keyFunctions("documents")[0]),
      "ALTER TABLE documents ADD COLUMN entity_ids text[] GENERATED ALWAYS AS (documents_entityids(doc)) STORED",
      "CREATE INDEX documents_entityids ON documents USING gin (entity_ids)",
    ]);
    expect(await syncSchema(conn)).toEqual([]);
  });

  const constraint = (name: string) => CONSTRAINTS.find((c) => c.name === name)!;

  it("restores a dropped foreign key", async () => {
    await exec("ALTER TABLE saved_queries DROP CONSTRAINT saved_queries_owner_id_fkey");
    expect(await syncSchema(conn)).toEqual([constraintDdl(constraint("saved_queries_owner_id_fkey"))]);
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("restores the dropped change triggers and the function they call", async () => {
    await exec("DROP FUNCTION notify_change() CASCADE");
    expect(await syncSchema(conn)).toEqual([...notifyTriggers("users"), ...notifyTriggers("settings")].map((t) => t.ddl));
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("replaces a foreign key declared with another action", async () => {
    await exec("ALTER TABLE entities DROP CONSTRAINT entities_parent_id_fkey");
    await exec("ALTER TABLE entities ADD CONSTRAINT entities_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES entities(id)");
    expect(await syncSchema(conn)).toEqual([
      "ALTER TABLE entities DROP CONSTRAINT entities_parent_id_fkey",
      constraintDdl(constraint("entities_parent_id_fkey")),
    ]);
    expect(await syncSchema(conn)).toEqual([]);
  });

  it("fails on a dangling row, naming the foreign key and the row", async () => {
    await exec("ALTER TABLE entities DROP CONSTRAINT entities_parent_id_fkey");
    await exec(`INSERT INTO entities (doc) VALUES ('{"id": "schema-test-orphan", "data": {"parent": {"territoryId": "schema-test-missing"}}}')`);
    try {
      await expect(syncSchema(conn)).rejects.toThrow(
        "entities_parent_id_fkey: entities row schema-test-orphan has parent_id = schema-test-missing"
      );
    } finally {
      await exec("DELETE FROM entities WHERE id = 'schema-test-orphan'");
    }
    expect(await syncSchema(conn)).toEqual([constraintDdl(constraint("entities_parent_id_fkey"))]);
  });

  it("fails on duplicate rows, naming the unique constraint and one of the rows", async () => {
    await exec("ALTER TABLE relations DROP CONSTRAINT relations_type_entity_ids_key");
    await exec(
      `INSERT INTO relations (doc) VALUES ('{"id": "schema-test-dup-1", "type": "CLA", "entityIds": ["a", "b"]}'), ('{"id": "schema-test-dup-2", "type": "CLA", "entityIds": ["a", "b"]}')`
    );
    try {
      await expect(syncSchema(conn)).rejects.toThrow(
        "relations_type_entity_ids_key: relations row schema-test-dup-1 shares (type, entity_ids) = (CLA,\"{a,b}\") with another row"
      );
    } finally {
      await exec("DELETE FROM relations WHERE id LIKE 'schema-test-dup-%'");
    }
    expect(await syncSchema(conn)).toEqual([constraintDdl(constraint("relations_type_entity_ids_key"))]);
  });

  it("stores an empty reference as no reference", async () => {
    await exec(
      `INSERT INTO entities (doc) VALUES ('{"id": "schema-test-empty", "usedTemplate": "", "data": {"territory": {"territoryId": ""}, "parent": {"territoryId": ""}, "documentId": ""}}')`
    );
    await exec(`INSERT INTO users (doc) VALUES ('{"id": "schema-test-user-1", "email": ""}'), ('{"id": "schema-test-user-2", "email": ""}')`);
    try {
      const { rows } = await query(conn, "SELECT territory_id, parent_id, used_template, document_id FROM entities WHERE id = 'schema-test-empty'");
      expect(rows).toEqual([{ territory_id: null, parent_id: null, used_template: null, document_id: null }]);
      expect((await query(conn, "SELECT email FROM users WHERE id LIKE 'schema-test-user-%'")).rows).toEqual([{ email: null }, { email: null }]);
    } finally {
      await exec("DELETE FROM entities WHERE id = 'schema-test-empty'");
      await exec("DELETE FROM users WHERE id LIKE 'schema-test-user-%'");
    }
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

describePg("SESSIONS_DDL", () => {
  let conn: Conn;
  beforeAll(async () => {
    conn = await openTestDb();
  });
  afterAll(async () => {
    await closeTestDb(conn);
  });

  it("moves the expression indexes of an older database onto the columns, and is idempotent", async () => {
    const indexes = async (): Promise<string[]> => {
      const { rows } = await query(conn, "SELECT indexname FROM pg_indexes WHERE tablename = 'sessions' ORDER BY indexname");
      return rows.map((row) => row.indexname);
    };
    await query(conn, "ALTER TABLE sessions DROP COLUMN user_id, DROP COLUMN expires_at");
    await query(conn, "CREATE INDEX sessions_userid ON sessions ((doc->>'userId'))");
    await query(conn, "CREATE INDEX sessions_expiresat ON sessions (((doc->>'expiresAt')::bigint))");
    await query(conn, `INSERT INTO sessions (doc) VALUES ('{"id": "schema-test-session", "userId": "u1", "expiresAt": 1700000000000}')`);
    for (let round = 0; round < 2; round++) {
      for (const statement of SESSIONS_DDL) {
        await query(conn, statement);
      }
      expect(await indexes()).toEqual(["sessions_expires_at", "sessions_pkey", "sessions_user_id"]);
    }
    const { rows } = await query(
      conn,
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions' AND is_generated = 'ALWAYS' ORDER BY column_name"
    );
    expect(rows.map((row) => row.column_name)).toEqual(["expires_at", "id", "user_id"]);
    const { rows: stored } = await query(conn, "SELECT user_id, expires_at FROM sessions WHERE id = 'schema-test-session'");
    expect(stored).toEqual([{ user_id: "u1", expires_at: "1700000000000" }]);
    await query(conn, "DELETE FROM sessions WHERE id = 'schema-test-session'");
  });
});
