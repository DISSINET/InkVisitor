/**
 * Connection settings for both backends, read from the environment in one
 * place. DB_ADAPTER picks the backend; DB_NAME names the database on either
 * one, so the test-database guard and the replay work from a single variable.
 */

export type AdapterKind = "rethinkdb" | "postgres";

export interface RethinkConfig {
  host?: string;
  port: number;
  db?: string;
  password?: string;
}

export interface PgConfig {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  database?: string;
}

export function adapterFromEnv(env: NodeJS.ProcessEnv = process.env): AdapterKind {
  const value = env.DB_ADAPTER || "rethinkdb";
  if (value !== "rethinkdb" && value !== "postgres") {
    throw new Error(`DB_ADAPTER must be "rethinkdb" or "postgres", got "${value}"`);
  }
  return value;
}

export const rethinkConfigFromEnv = (env: NodeJS.ProcessEnv = process.env): RethinkConfig => ({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT || "28015"),
  db: env.DB_NAME,
  password: env.DB_AUTH,
});

export const pgConfigFromEnv = (env: NodeJS.ProcessEnv = process.env): PgConfig => ({
  host: env.PG_HOST,
  port: parseInt(env.PG_PORT || "5432"),
  user: env.PG_USER,
  password: env.PG_PASS,
  database: env.DB_NAME,
});
