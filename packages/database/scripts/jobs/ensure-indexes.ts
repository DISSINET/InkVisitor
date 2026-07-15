import { Connection, r } from "rethinkdb-ts";
import colors from "colors";
import { IJob } from ".";
import { DbSchemaIndexes } from "../import/indexes";
import { DbSchema } from "../import/common";

/**
 * Walks every table declared in DbSchemaIndexes and ensures each declared
 * index exists. Missing ones are created and waited on; existing ones are
 * left alone. Safe to run repeatedly against any environment that pre-dates
 * a particular index addition.
 *
 * Each entry in DbSchemaIndexes carries its name as data (see IndexDef in
 * common.ts), so we can compare against `indexList()` without having to
 * run the factory just to recover the name.
 *
 * Note: indexes are matched by name only. If an index *definition* changes
 * while the name stays the same, drop the old one manually before running
 * this job.
 */
const ensureIndexesJob: IJob = async (db: Connection): Promise<void> => {
  const tableList = await r.tableList().run(db);

  for (const [tableName, indexDefs] of Object.entries(DbSchemaIndexes)) {
    const tablePhysicalName = tableNameFor(tableName as keyof DbSchema);
    if (!tableList.includes(tablePhysicalName)) {
      console.log(
        colors.yellow(`Skipping ${tablePhysicalName}: table does not exist`)
      );
      continue;
    }
    if (indexDefs.length === 0) {
      continue;
    }

    const table = r.table(tablePhysicalName);
    const existing = (await table.indexList().run(db)) as string[];

    for (const def of indexDefs) {
      if (existing.includes(def.name)) {
        continue;
      }
      console.log(
        colors.cyan(`Creating index ${tablePhysicalName}.${def.name} ...`)
      );
      await def.build(table).run(db);
      await table.indexWait(def.name).run(db);
      console.log(
        colors.green(`Index ${tablePhysicalName}.${def.name} ready`)
      );
    }
  }
};

// Schema keys are camelCase; physical RethinkDB table names diverge for
// the ACL and stats tables (see import.ts where the TableSchema literals
// declare each tableName). The Record type forces exhaustiveness: adding
// a new key to DbSchema is a compile error here until it's mapped.
const TABLE_PHYSICAL_NAMES: Record<keyof DbSchema, string> = {
  users: "users",
  aclPermissions: "acl_permissions",
  entities: "entities",
  audits: "audits",
  relations: "relations",
  documents: "documents",
  settings: "settings",
  statsMaterializedDay: "stats_materialized_day",
  statsMaterializedWeek: "stats_materialized_week",
  statsMaterializedMonth: "stats_materialized_month",
  statsMaterializedYear: "stats_materialized_year",
  savedQueries: "saved_queries",
};

const tableNameFor = (key: keyof DbSchema): string =>
  TABLE_PHYSICAL_NAMES[key];

export default ensureIndexesJob;
