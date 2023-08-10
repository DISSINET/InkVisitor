import { IAudit } from "@shared/types";
import { r, Connection } from "rethinkdb-ts";
import { ITask } from ".";
import Audit from "@models/audit/audit";

const changeKeysTask: ITask = async (db: Connection): Promise<void> => {
  const data = (await r.table(Audit.table).run(db) as IAudit[])

  for (const d of data) {
    if ((d as any).user) {
      console.log(`Audit ${d.id} has old 'user' key`)
      d.userId = (d as any).user;
      delete (d as any).user;
      await r.table(Audit.table).get(d.id).replace(d).run(db);
    }
  }
}

export default changeKeysTask;
