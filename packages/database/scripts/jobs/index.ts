import { r, Connection, } from "rethinkdb-ts";
import restoreDates from "./restore-dates"
import printDeletedEntities from "./print-deleted-entities"
import fixDuplicatedElementsTask from "./fix-duplicated-array-elements";

export type ITask = (db: Connection) => Promise<void>

const alljobs: Record<string, ITask> = {
  restoreDates,
  printDeletedEntities,
  fixDuplicatedElementsTask,
}

export default alljobs;
