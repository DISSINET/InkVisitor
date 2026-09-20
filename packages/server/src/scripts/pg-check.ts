import "../settings";
import { Client } from "pg";

// Connectivity gate for the PostgreSQL instance (#3257): connects with the
// PG_* variables from the loaded env file and prints the server version.
(async () => {
  const target = `${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_NAME}`;
  const client = new Client({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    database: process.env.PG_NAME,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
  });
  await client.connect();
  const { rows } = await client.query("SELECT version()");
  await client.end();
  console.log(`[pg-check] OK ${target}\n${rows[0].version}`);
})().catch((e) => {
  console.error(`[pg-check] FAILED: ${e.message}`);
  process.exit(1);
});
