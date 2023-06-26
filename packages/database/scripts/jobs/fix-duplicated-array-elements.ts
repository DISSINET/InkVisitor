import { IAudit, IEntity, IStatement } from "@shared/types";
import { r, Connection, RDatum, } from "rethinkdb-ts";
import { ITask } from ".";
import { EntityEnums } from "@shared/enums";
import Statement from "@models/statement/statement"

const fixDuplicatedElementsTask: ITask = async (db: Connection): Promise<void> => {
  const statementsData = (await r.table("entities").filter({ class: EntityEnums.Class.Statement}).run(db) as IEntity[]).map(data => new Statement(data as Partial<IStatement>))

  for (const s of statementsData) {
    console.log("got statement", s.id, s.data.actions.map(a => a.mood))
  }
}

export default fixDuplicatedElementsTask;
