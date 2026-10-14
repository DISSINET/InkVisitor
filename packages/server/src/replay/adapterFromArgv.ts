/**
 * `--adapter=<kind>` must be in the environment before ./seed imports the
 * storage module, which picks the adapter at load time; this file is the
 * first import of run.ts for that reason.
 */
const arg = process.argv.find((a) => a.startsWith("--adapter="));
export const adapter = arg ? arg.slice("--adapter=".length) : "rethinkdb";
process.env.DB_ADAPTER = adapter;
// the in-process seed reads the PG config when the storage module loads
process.env.PG_HOST ||= "localhost";
process.env.PG_PORT ||= "5432";
process.env.PG_USER ||= "inkvisitor";
process.env.PG_PASS ||= "inkvisitor";
