import { IAudit, IEntity, IProp, IStatement } from "@shared/types";
import { r, Connection, RDatum, } from "rethinkdb-ts";
import { ITask } from ".";
import { EntityEnums } from "@shared/enums";
import Statement from "@models/statement/statement"
import Entity from "@models/entity/entity";

function hasDuplicates(arr: any[]): boolean {
  return arr.length !== new Set(arr).size;
}

function removeDuplicates<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function doNestedProps(arr: IProp[], lvl: number): boolean {
  let isOk = true;
  for (const prop of arr) {
    if(hasDuplicates(prop.mood)) {
      isOk = false
      console.log(`Fixing props for lvl ${lvl}`)
      prop.mood = removeDuplicates(prop.mood)
    }
    if (prop.children && prop.children.length) {
      isOk = doNestedProps(prop.children, lvl+1)
    }
  }
  return isOk
}

const fixEntities = async (db: Connection): Promise<void> => {
  const data = (await r.table("entities").run(db) as IEntity[])

  for (const d of data) {
    const isOk = doNestedProps(d.props, 1)

    if (!isOk) {
      console.log(`Needs to update ${d.id}`)
      await r.table(Entity.table).get(d.id).update(d).run(db);
    }
  }
}

const fixStatements = async (db: Connection): Promise<void> => {
  const statementsData = (await r.table("entities").filter({ class: EntityEnums.Class.Statement}).run(db) as IStatement[])

  for (const s of statementsData) {
    let isOk = true;
    for (const action of s.data.actions) {
      if (hasDuplicates(action.mood)) {
        isOk = false;
        console.log(`Fixing action.mood for ${s.id}`)
        action.mood = removeDuplicates(action.mood)
      }

      isOk = isOk && doNestedProps(action.props, 1)
    }

    for (const actant of s.data.actants) {
      if (actant.identifications && actant.identifications.length) {
        for (const identification of actant.identifications) {
          if (hasDuplicates(identification.mood)) {
            isOk = false;
            console.log(`Fixing actant.identification.mood for ${s.id}`)
            identification.mood = removeDuplicates(identification.mood)
          }
        }
      }

      if (actant.classifications && actant.classifications.length) {
        for (const classification of actant.classifications) {
          if (hasDuplicates(classification.mood)) {
            isOk = false;
            console.log(`Fixing actant.classification.mood for ${s.id}`)
            classification.mood = removeDuplicates(classification.mood)
          }
        }
      }

      isOk = isOk && doNestedProps(actant.props, 1)
    }


    if (hasDuplicates(s.data.tags)) {
        isOk = false;
        console.log(`Fixing s.data.tags for ${s.id}`)
        s.data.tags = removeDuplicates(s.data.tags)
    }

    if (!isOk) {
      console.log(`Needs to update ${s.id}`)
      await r.table(Entity.table).get(s.id).update(s).run(db);
    }
  }
}

const fixDuplicatedElementsTask: ITask = async (db: Connection): Promise<void> => {
  await fixStatements(db)
  await fixEntities(db)
}

export default fixDuplicatedElementsTask;
