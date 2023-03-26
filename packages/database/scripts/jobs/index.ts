import { r, Connection, } from "rethinkdb-ts";
import restoreDates from "./restore-dates"
export type ITask = (db: Connection) => Promise<void>

const alljobs: Record<string, ITask> = {
  restoreDates: restoreDates
}

export default alljobs;
