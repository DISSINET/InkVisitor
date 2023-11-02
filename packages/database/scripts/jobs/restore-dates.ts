import { IAudit, IEntity } from "@shared/types";
import { r, Connection } from "rethinkdb-ts";
import { IJob } from ".";

const restoreDatesJob: IJob = async (db: Connection): Promise<void> => {
  const entitiesWithoutCreatedAt = await r.table("entities").
  //filter(function (e: RDatum) {
   // return e.hasFields("createdAt").not()
  //}).
  run(db) as IEntity[];

  for (const entity of entitiesWithoutCreatedAt) {
    const firstAudit: IAudit[] = await r.table("audits").filter({ entityId: entity.id }).orderBy(r.asc("date")).limit(1).run(db)
    const lastAudit: IAudit[] = await r.table("audits").filter({ entityId: entity.id }).orderBy(r.desc("date")).limit(1).run(db);
    if (!firstAudit.length) {
      continue
    }

    const update: { createdAt: Date, updatedAt?: Date } = {
      createdAt: firstAudit[0].date
    }

    if (lastAudit.length && lastAudit[0].id !== firstAudit[0].id) {
      update.updatedAt = lastAudit[0].date;
    }

    await r.table("entities").get(entity.id).update(update).run(db)

    console.log(`Updated dates for ${entity.id}: ${JSON.stringify(update)}`)
  }
}

export default restoreDatesJob;
