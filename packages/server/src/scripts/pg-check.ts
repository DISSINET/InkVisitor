import "../settings";
import { Client } from "pg";
import { pgConfigFromEnv } from "@service/storage/config";

// Connectivity gate for the PostgreSQL instance (#3257): connects with the
// PG_* variables from the loaded env file to the maintenance database, prints
// the server version and checks that the database folds case for non-ASCII
// letters.

// Case-insensitive matching of a non-ASCII letter holds only under a
// Unicode-aware ctype (C.UTF-8, en_US.utf8); the accent-insensitive label
// search relies on it. An existing database is probed as it is; a missing one
// is created by the server with the builtin C.UTF-8 locale, so the probe checks
// that locale on the server (database null: probed on the maintenance database).
async function assertUnicodeCtype(
  config: ReturnType<typeof pgConfigFromEnv>,
  database: string | null
): Promise<void> {
  const client = new Client({ ...config, database: database ?? "postgres" });
  await client.connect();
  try {
    const probe = database
      ? "SELECT 'Ä' ~* 'ä' AS unicode"
      : "SELECT 'Ä' COLLATE pg_c_utf8 ~* 'ä' AS unicode";
    const { rows } = await client.query(probe);
    if (!rows[0].unicode) {
      const info = await client.query(
        "SELECT datctype, datlocale FROM pg_database WHERE datname = current_database()"
      );
      const { datctype, datlocale } = info.rows[0];
      throw new Error(
        `database ${database ?? config.database} has ctype ${datctype} (locale ${
          datlocale ?? "none"
        }); ` + `accent-insensitive search needs a UTF-8 ctype (C.UTF-8 or en_US.utf8)`
      );
    }
  } finally {
    await client.end();
  }
}

(async () => {
  const config = pgConfigFromEnv();
  const target = `${config.host}:${config.port}`;
  const client = new Client({ ...config, database: "postgres" }); // maintenance DB
  await client.connect();
  const { rows } = await client.query("SELECT version()");
  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
    config.database ?? "",
  ]);
  await client.end();
  const database = existing.rowCount ? (config.database as string) : null;
  await assertUnicodeCtype(config, database);
  const probed = database
    ? `ctype of ${database} is Unicode-aware`
    : `builtin C.UTF-8 locale available for ${config.database || "<unset>"}`;
  console.log(`[pg-check] OK ${target} (${probed})\n${rows[0].version}`);
})().catch((e) => {
  console.error(`[pg-check] FAILED: ${e.message}`);
  process.exit(1);
});
