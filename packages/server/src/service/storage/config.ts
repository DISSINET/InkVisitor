/**
 * Connection settings read from the environment in one place. DB_NAME names
 * the database, so the test-database guard and the replay work from a single
 * variable.
 */

export interface RethinkConfig {
  host?: string;
  port: number;
  db?: string;
  password?: string;
}

export const rethinkConfigFromEnv = (env: NodeJS.ProcessEnv = process.env): RethinkConfig => ({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT || "28015"),
  db: env.DB_NAME,
  password: env.DB_AUTH,
});
