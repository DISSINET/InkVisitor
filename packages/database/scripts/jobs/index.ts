import { r, Connection, } from "rethinkdb-ts";
import restoreDates from "./restore-dates"
import printDeletedEntities from "./print-deleted-entities"

export type ITask = (db: Connection) => Promise<void>

const alljobs: Record<string, ITask> = {
  restoreDates,
  printDeletedEntities
}

export default alljobs;
