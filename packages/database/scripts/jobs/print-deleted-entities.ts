import { IAudit, IEntity } from "@shared/types";
import { r, Connection, RDatum, } from "rethinkdb-ts";
import { ITask } from ".";

const printDeletedEntities: ITask = async (db: Connection): Promise<void> => {
  const entityIdsFromRelations = (await r.table("relations").pluck("entityIds", "id").run(db)) as { entityIds: string[], id: string}[];
  const idsMap = entityIdsFromRelations.reduce<Record<string, {relationIds: string[]}>>((acc, curr) => {
    for(const id of curr.entityIds) {
      if (!acc[id]) {
        acc[id] = { relationIds: []}
      }
      if (!id) {
        console.log("Empty id")
      }
      acc[id].relationIds.push(curr.id);
    }
    return acc
  }, {})

  console.log(`Got ${Object.keys(idsMap).length} items`)
  let i = 0;
  for (const entityId of Object.keys(idsMap)) {
    i++;
    const entity = await r.table("entities").get(entityId).run(db);
    if (!entity || entity.length === 0) {
      console.log(`Entity ${entityId} not found in: ${idsMap[entityId].relationIds.join(",")}`)
    }
    if (i % 100 === 0) {
      console.log(`${i}/${Object.keys(idsMap).length}`)
    }
  }
}

export default printDeletedEntities;
