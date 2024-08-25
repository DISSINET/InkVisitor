import { Connection, } from "rethinkdb-ts";
import restoreDatesJob from "./restore-dates"
import printDeletedEntitiesJob from "./print-deleted-entities"
import fixDuplicatedElementsJob from "./fix-duplicated-array-elements";
import addPosFieldJob from "./add-pos-field";
import generateDatasetJob from "./generate-datasets/generate-dataset";
import exportACR from "./export-a-c-r";
import fixACR from "./fix-acr";
import addAuditType from "./add-audit-type";

export type IJob = (db: Connection) => Promise<void>

const alljobs: Record<string, IJob> = {
  restoreDatesJob,
  printDeletedEntitiesJob,
  fixDuplicatedElementsJob,
  addPosFieldJob,
  generateDatasetJob,
  exportACR,
  fixACR,
  addAuditType
}

export default alljobs;
