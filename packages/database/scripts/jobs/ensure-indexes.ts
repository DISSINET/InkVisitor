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
 * Note: the index definitions are anonymous functions in indexes.ts, so we
 * can only match by index name - not by content. If an index definition
 * changes, drop the old one manually before running this job.
 */
const ensureIndexesJob: IJob = async (db: Connection): Promise<void> => {
  const tableList = await r.tableList().run(db);

  for (const [tableName, indexFactories] of Object.entries(DbSchemaIndexes)) {
    const tablePhysicalName = tableNameFor(tableName as keyof DbSchema);
    if (!tableList.includes(tablePhysicalName)) {
      console.log(
        colors.yellow(`Skipping ${tablePhysicalName}: table does not exist`)
      );
      continue;
    }
    if (indexFactories.length === 0) {
      continue;
    }

    const table = r.table(tablePhysicalName);
    const existing = (await table.indexList().run(db)) as string[];

    for (const factory of indexFactories) {
      // The factory invokes table.indexCreate(name, ...) - we need the name
      // to compare against existing. Run it against a stub table object so
      // we can intercept the call without touching the DB.
      const name = pluckIndexName(factory);
      if (!name) {
        console.log(
          colors.yellow(
            `Could not detect index name for ${tablePhysicalName} - skipping`
          )
        );
        continue;
      }
      if (existing.includes(name)) {
        continue;
      }
      console.log(
        colors.cyan(`Creating index ${tablePhysicalName}.${name} ...`)
      );
      await factory(table).run(db);
      await table.indexWait(name).run(db);
      console.log(colors.green(`Index ${tablePhysicalName}.${name} ready`));
    }
  }
};

const tableNameFor = (key: keyof DbSchema): string => {
  // The schema keys are camelCase; physical table names match for most of
  // them but acl_permissions uses snake_case.
  switch (key) {
    case "aclPermissions":
      return "acl_permissions";
    default:
      return key;
  }
};

/**
 * Inspects a factory `(table) => table.indexCreate(name, ...)` by invoking
 * it against a stub `table` whose `indexCreate(name)` records the first arg.
 * Avoids relying on stringification of the factory body.
 */
const pluckIndexName = (factory: (table: any) => any): string | null => {
  let captured: string | null = null;
  const stub: any = {
    indexCreate: (name: string) => {
      captured = name;
      // Return a chainable no-op so the factory body can keep building.
      return new Proxy(() => stub, { get: () => stub.indexCreate });
    },
  };
  try {
    factory(stub);
  } catch {
    // some factory shapes may throw mid-build with the stub; that's fine
    // as long as captured was set before the throw.
  }
  return captured;
};

export default ensureIndexesJob;
