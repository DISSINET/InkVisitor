import { Connection, r } from "rethinkdb-ts";
import { DbEnums } from "@inkvisitor/shared/enums";
import { AuditScope } from "@inkvisitor/shared/types";
import { IJob } from ".";

const BATCH_SIZE = 500;

const migrateAuditsToModelIdScopeJob: IJob = async (db: Connection): Promise<void> => {
  const table = r.table("audits");
  const cursor = await table.run(db);
  let updated = 0;
  let batch: Array<{ id: string; modelId: string; auditScope: AuditScope }> = [];

  for await (const row of cursor) {
    const doc = row as Record<string, unknown>;
    if (doc.modelId != null) continue;
    const entityId = doc.entityId as string | undefined;
    const documentId = doc.documentId as string | undefined;
    let modelId: string;
    let auditScope: AuditScope;
    if (entityId != null && entityId !== "") {
      modelId = entityId;
      auditScope = AuditScope.Entity;
    } else if (documentId != null && documentId !== "") {
      modelId = documentId;
      auditScope = AuditScope.Document;
    } else {
      continue;
    }
    batch.push({ id: doc.id as string, modelId, auditScope });
    if (batch.length >= BATCH_SIZE) {
      for (const item of batch) {
        await table.get(item.id).update({ modelId: item.modelId, auditScope: item.auditScope }).run(db);
        updated++;
      }
      console.log(`Migrated ${updated} audit rows...`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    for (const item of batch) {
      await table.get(item.id).update({ modelId: item.modelId, auditScope: item.auditScope }).run(db);
      updated++;
    }
  }
  console.log(`Backfill complete: ${updated} audit rows updated.`);

  const indexList = (await table.indexList().run(db)) as string[];
  if (!indexList.includes(DbEnums.Indexes.AuditScopeModelId)) {
    await table
      .indexCreate(DbEnums.Indexes.AuditScopeModelId, [r.row("auditScope"), r.row("modelId")])
      .run(db);
    console.log(`Created index ${DbEnums.Indexes.AuditScopeModelId}.`);
  }
  const oldIndexes = ["entityId", "documentId"];
  for (const name of oldIndexes) {
    if (indexList.includes(name)) {
      await table.indexDrop(name).run(db);
      console.log(`Dropped index ${name}.`);
    }
  }
};

export default migrateAuditsToModelIdScopeJob;
