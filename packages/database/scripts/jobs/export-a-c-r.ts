import { IAction, IConcept, IResource } from "@shared/types";
import { Connection, r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import { IJob } from ".";
import { DbEnums, EntityEnums, RelationEnums } from "@shared/enums";
import Generator from "./Generator";
import { Db } from "@service/rethink";
import Relation from "@models/relation/relation";
import { Relation as RelationTypes } from "@shared/types";
import { question } from "scripts/import/prompts";
import * as fs from "fs"
import * as path from "path"
import Entity from "@models/entity/entity";

export async function getEntitiesDataByClass<T>(
  db: Connection,
  entityClass: EntityEnums.Class
): Promise<T[]> {
  const connection = db instanceof Db ? db.connection : db;
  return rethink
    .table(Entity.table)
    .getAll(entityClass, { index: DbEnums.Indexes.Class })
    .run(connection);
}

 async  function findForEntities<T extends RelationTypes.IRelation> (
  db: Connection,
  entityIds: string[],
  relType?: RelationEnums.Type,
  position?: number
): Promise<T[]> {
  const items: T[] = await rethink
    .table(Relation.table)
    .getAll.call(undefined, ...entityIds, {
      index: DbEnums.Indexes.RelationsEntityIds,
    })
    .filter(relType ? { type: relType } : {})
    .distinct()
    .run(db);

  if (position !== undefined) {
    return items.filter(
      (d) => entityIds.indexOf(d.entityIds[position]) !== -1
    );
  }
  return items;
}

class ACRGenerator extends Generator {
  getPath(filename?: string) {
    if (!this.datasetName) {
      throw new Error("Dataset name not yet set, cannot create the path to directory")
    }

    let parts = [__dirname, "..", "..", Generator.DIRECTORY, this.datasetName]
    if (filename) {
      parts.push(filename)
    }
    return path.join.apply(undefined, parts)
  }


  async getUserInfo() {
    this.datasetName = await question<string>(
       "Name of the dataset?",
       (input: string): string => {
         return input;
       },
       ""
     );
     if (!this.datasetName) {
       throw new Error("Dataset name should not be empty")
     }
     const datasetPath = this.getPath()
     if(fs.existsSync(datasetPath)) {
       throw new Error(`The dataset path (${datasetPath}) already exists`)
     }
   }
}

const exportACR: IJob = async (db: Connection): Promise<void> => {
  const generator = new ACRGenerator();
  await generator.getUserInfo()

  const actions = await getEntitiesDataByClass<IAction>(db, EntityEnums.Class.Action);
  const concepts = await getEntitiesDataByClass<IConcept>(db, EntityEnums.Class.Concept);
  const resources = await getEntitiesDataByClass<IResource>(db, EntityEnums.Class.Resource);

  const actionRels = await findForEntities(db, actions.map(a => a.id))
  const conceptRels = await findForEntities(db, concepts.map(c => c.id))

  generator.entities.entities.A = actions
  generator.entities.entities.C = concepts
  generator.entities.entities.R = resources

  generator.output()
}

export default exportACR;
