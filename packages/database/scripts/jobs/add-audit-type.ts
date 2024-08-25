import { Connection } from "rethinkdb-ts";
import { IJob } from ".";
import * as fs from "fs";
import { IAudit } from "@shared/types";
import { EventType } from "@shared/types/stats";


const addPosFieldJob: IJob = async (db: Connection): Promise<void> => {
  const path = "./datasets/all-parsed/audits.json"
  const data = JSON.parse(fs.readFileSync(path, 'utf8')) as IAudit[];
  data.forEach(element => {
    element.type = EventType.CREATE;
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 4))
}

export default addPosFieldJob;
