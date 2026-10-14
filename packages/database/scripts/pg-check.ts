import { Client } from "pg";

// Connectivity gate for the PostgreSQL instance (#3257): connects with the
// PG_* variables from env/.env (or env/.env.<arg>) and prints the server version.
const env = process.argv[2];
const envFile = `env/.env${env ? "." + env : ""}`;
const vars = require("dotenv").config({ path: envFile }).parsed;
if (!vars) {
  throw new Error(`Cannot load env file ${envFile}`);
}

(async () => {
  const target = `${vars.PG_HOST}:${vars.PG_PORT}/${vars.PG_NAME}`;
  const client = new Client({
    host: vars.PG_HOST,
    port: Number(vars.PG_PORT),
    database: vars.PG_NAME,
    user: vars.PG_USER,
    password: vars.PG_PASS,
  });
  await client.connect();
  const { rows } = await client.query("SELECT version()");
  // case-insensitive matching of a non-ASCII letter holds only under a
  // Unicode-aware ctype; the server's accent-insensitive label search needs it
  const probe = await client.query("SELECT 'Ä' ~* 'ä' AS unicode");
  if (!probe.rows[0].unicode) {
    const ctype = await client.query(
      "SELECT datctype, datlocale FROM pg_database WHERE datname = current_database()"
    );
    await client.end();
    throw new Error(
      `database ${vars.PG_NAME} has ctype ${ctype.rows[0].datctype} ` +
        `(locale ${ctype.rows[0].datlocale ?? "none"}); ` +
        `accent-insensitive search needs a UTF-8 ctype (C.UTF-8 or en_US.utf8)`
    );
  }
  await client.end();
  console.log(`[pg-check] OK ${target}\n${rows[0].version}`);
})().catch((e) => {
  console.error(`[pg-check] FAILED: ${e.message}`);
  process.exit(1);
});
