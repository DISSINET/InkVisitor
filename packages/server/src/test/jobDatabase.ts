import { Client } from "pg";
import { Connection, r } from "rethinkdb-ts";
import addGeocodingSourcesJob, {
  addGeocodingSourcesPgJob,
} from "../../../database/scripts/jobs/add-geocoding-sources";
import nestGeocodingAccuracyJob, {
  nestGeocodingAccuracyPgJob,
} from "../../../database/scripts/jobs/nest-geocoding-accuracy";
import {
  GeocodingRows,
  pgGeocodingRows,
  rethinkGeocodingRows,
} from "../../../database/scripts/jobs/geocoding-rows";
import { getTestDbName } from "./db";
import { pgConfigFromEnv, rethinkConfigFromEnv } from "../service/storage/config";
import { storage } from "../service/storage/instance";

// the jobs under their names in the importer's menu; that the menu lists them
// under these names is checked in packages/database/scripts/jobs/index.test.ts
const rethinkJobs: Record<string, (db: Connection) => Promise<void>> = {
  nestGeocodingAccuracyJob,
  addGeocodingSourcesJob,
};
const pgJobs: Record<string, (db: Client) => Promise<void>> = {
  nestGeocodingAccuracyJob: nestGeocodingAccuracyPgJob,
  addGeocodingSourcesJob: addGeocodingSourcesPgJob,
};

/**
 * The test database of the adapter this run is set to, opened the way a
 * database job opens it: a raw RethinkDB connection or a raw PostgreSQL client.
 * The same job scenarios then run against whichever database that is.
 */
export interface JobDatabase {
  rows: GeocodingRows;
  /** runs a job, by its name in the importer's menu, on this database */
  run(name: string): Promise<void>;
  clear(): Promise<void>;
  insertSetting(row: object): Promise<void>;
  replaceSetting(row: { id: string; value: unknown }): Promise<void>;
  insertEntities(rows: object[]): Promise<void>;
  entity(id: string): Promise<any>;
  /** every entity, ordered by id */
  entities(): Promise<any[]>;
  setProps(id: string, props: unknown[]): Promise<void>;
  close(): Promise<void>;
}

const openRethink = async (): Promise<JobDatabase> => {
  const config = rethinkConfigFromEnv();
  const conn: Connection = await r.connect({
    host: config.host || "localhost",
    port: config.port,
    password: config.password || undefined,
    timeout: 5,
  });
  conn.use(getTestDbName());
  return {
    rows: rethinkGeocodingRows(conn),
    run: (name) => rethinkJobs[name](conn),
    clear: async () => {
      await r.table("entities").delete().run(conn);
      await r.table("settings").delete().run(conn);
    },
    insertSetting: async (row) => {
      await r.table("settings").insert(row).run(conn);
    },
    replaceSetting: async (row) => {
      await r.table("settings").get(row.id).replace(row).run(conn);
    },
    insertEntities: async (rows) => {
      await r.table("entities").insert(rows).run(conn);
    },
    entity: (id) => r.table("entities").get(id).run(conn),
    entities: () => r.table("entities").orderBy("id").run(conn),
    setProps: async (id, props) => {
      await r.table("entities").get(id).update({ props }).run(conn);
    },
    close: () => conn.close(),
  };
};

const openPg = async (): Promise<JobDatabase> => {
  const client = new Client({ ...pgConfigFromEnv(), database: getTestDbName() });
  await client.connect();
  const docs = async (sql: string, params: unknown[] = []) =>
    (await client.query(sql, params)).rows.map((row) => row.doc);
  return {
    rows: pgGeocodingRows(client),
    run: (name) => pgJobs[name](client),
    // TRUNCATE, since a DELETE of territories and their statements in one
    // statement trips the ON DELETE RESTRICT foreign keys between them
    clear: async () => {
      await client.query("TRUNCATE entities");
      await client.query("DELETE FROM settings");
    },
    insertSetting: async (row) => {
      await client.query("INSERT INTO settings (doc) VALUES ($1::jsonb)", [JSON.stringify(row)]);
    },
    replaceSetting: async (row) => {
      await client.query("UPDATE settings SET doc = $2::jsonb WHERE id = $1", [
        row.id,
        JSON.stringify(row),
      ]);
    },
    insertEntities: async (rows) => {
      await client.query("INSERT INTO entities (doc) SELECT jsonb_array_elements($1::jsonb)", [
        JSON.stringify(rows),
      ]);
    },
    entity: async (id) => (await docs("SELECT doc FROM entities WHERE id = $1", [id]))[0] ?? null,
    entities: () => docs("SELECT doc FROM entities ORDER BY id"),
    setProps: async (id, props) => {
      await client.query(
        "UPDATE entities SET doc = jsonb_set(doc, '{props}', $2::jsonb) WHERE id = $1",
        [id, JSON.stringify(props)]
      );
    },
    close: () => client.end(),
  };
};

export const openJobDatabase = (): Promise<JobDatabase> =>
  storage.kind === "postgres" ? openPg() : openRethink();
