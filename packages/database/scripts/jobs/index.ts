import { r, Connection, } from "rethinkdb-ts";
import restoreDates from "./restore-dates"
import printDeletedEntities from "./print-deleted-entities"
import fixDuplicatedElementsTask from "./fix-duplicated-array-elements";
import addPosFieldTask from "./add-pos-field";
import changeKeysTask from "./change-audit-user-key";

export type ITask = (db: Connection) => Promise<void>

const alljobs: Record<string, ITask> = {
  restoreDates,
  printDeletedEntities,
  fixDuplicatedElementsTask,
  addPosFieldTask,
  changeKeysTask,
}

export default alljobs;
