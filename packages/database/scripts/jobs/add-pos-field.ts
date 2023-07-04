import { IAction, IAudit, IConcept, IEntity, IProp, IStatement } from "@shared/types";
import { r, Connection, RDatum, } from "rethinkdb-ts";
import { ITask } from ".";
import { EntityEnums } from "@shared/enums";
import Statement from "@models/statement/statement"
import Entity from "@models/entity/entity";

const fixActions = async (db: Connection): Promise<void> => {
  const data = (await r.table(Entity.table).filter({class: EntityEnums.Class.Action}).run(db) as IAction[])

  for (const d of data) {
    if (d.data.pos !== EntityEnums.ActionPartOfSpeech.Verb) {
      console.log(`Action ${d.id} does have bad pos value`)
      d.data.pos = EntityEnums.ActionPartOfSpeech.Verb
      await r.table(Entity.table).get(d.id).update(d).run(db);
    }
  }
}

const fixConcepts = async (db: Connection): Promise<void> => {
  const data = (await r.table(Entity.table).filter({class: EntityEnums.Class.Concept}).run(db) as IConcept[])

  for (const d of data) {
    if (typeof d.data.pos === "undefined") {
      console.log(`Concept ${d.id} does have bad pos value`)
      d.data.pos = EntityEnums.ConceptPartOfSpeech.Empty
      await r.table(Entity.table).get(d.id).update(d).run(db);
    }
  }
}
const addPosFieldTask: ITask = async (db: Connection): Promise<void> => {
  await fixActions(db)
  await fixConcepts(db)
}

export default addPosFieldTask;
