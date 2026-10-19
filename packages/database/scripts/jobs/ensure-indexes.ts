import { Connection, r } from "rethinkdb-ts";
import colors from "colors";
import { IJob } from ".";
import { TABLES, buildIndex } from "@service/storage/rethink/provision";

/**
 * Walks every table of the RethinkDB catalogue and ensures each declared index
 * exists. Missing ones are created and waited on; existing ones are left
 * alone. Safe to run repeatedly against any environment that pre-dates a
 * particular index addition.
 *
 * Note: indexes are matched by name only. If an index *definition* changes
 * while the name stays the same, drop the old one manually before running
 * this job.
 */
const ensureIndexesJob: IJob = async (db: Connection): Promise<void> => {
  const tableList = await r.tableList().run(db);

  for (const [tableName, indexes] of Object.entries(TABLES)) {
    if (!tableList.includes(tableName)) {
      console.log(colors.yellow(`Skipping ${tableName}: table does not exist`));
      continue;
    }
    if (indexes.length === 0) {
      continue;
    }

    const table = r.table(tableName);
    const existing = (await table.indexList().run(db)) as string[];

    for (const index of indexes) {
      if (existing.includes(index.name)) {
        continue;
      }
      console.log(colors.cyan(`Creating index ${tableName}.${index.name} ...`));
      await buildIndex(table, index).run(db);
      await table.indexWait(index.name).run(db);
      console.log(colors.green(`Index ${tableName}.${index.name} ready`));
    }
  }
};

export default ensureIndexesJob;
