import { IAudit, AuditScope } from "@shared/types";
import { EventType } from "@shared/types/stats";
import { Connection, r, RDatum } from "rethinkdb-ts";
import { IJob } from ".";

const BATCH_SIZE = 100;

// Gets all audits where type is missing and sets it to
// EventType.CREATE if the entityId is mentioned first time,
// EventType.EDIT otherwise.

const fixMissingAuditTypeJob: IJob = async (db: Connection): Promise<void> => {
  // Get all audits ordered by date to ensure correct first-mention detection
  const audits = (await r
    .table("audits")
    .orderBy({ index: "date" })
    .run(db)) as IAudit[];

  const entityIds = new Set<string>();
  const auditsToUpdate: Array<{ id: string; type: EventType }> = [];

  // First pass: identify audits that need updating
  for (const audit of audits) {
    const auditEntityId =
      audit.auditScope === AuditScope.Entity
        ? audit.modelId
        : (audit as { entityId?: string }).entityId;
    if (!auditEntityId) continue;

    if (!audit.type) {
      const isFirstTimeMentioned = !entityIds.has(auditEntityId);
      // Only store the id and the new type value
      auditsToUpdate.push({
        id: audit.id,
        type: isFirstTimeMentioned ? EventType.CREATE : EventType.EDIT,
      });
    }
    entityIds.add(auditEntityId);
  }

  if (auditsToUpdate.length > 0) {
    console.log(
      `Updating ${auditsToUpdate.length} audits with missing types...`
    );

    for (let i = 0; i < auditsToUpdate.length; i += BATCH_SIZE) {
      const batch = auditsToUpdate.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
          auditsToUpdate.length / BATCH_SIZE
        )}...`
      );

      // Update each audit in the batch using update instead of insert
      await r
        .table("audits")
        .getAll(...batch.map((b) => b.id))
        .update((audit: RDatum<IAudit>) => ({
          type: r
            .expr(batch)
            .filter({ id: audit("id") })
            .nth(0)("type"),
        }))
        .run(db);
    }

    console.log("Update completed successfully.");
  } else {
    console.log("No audits with missing types found.");
  }
};

export default fixMissingAuditTypeJob;
