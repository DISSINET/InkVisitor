import { Connection, r } from "rethinkdb-ts";
import { IJob } from ".";

const createSavedQueriesTableJob: IJob = async (
  db: Connection
): Promise<void> => {
  const tables = await r.tableList().run(db);
  if (tables.includes("saved_queries")) {
    console.log("Table saved_queries already exists");
    return;
  }
  await r.tableCreate("saved_queries").run(db);
  console.log("Table saved_queries created");
};

export default createSavedQueriesTableJob;
