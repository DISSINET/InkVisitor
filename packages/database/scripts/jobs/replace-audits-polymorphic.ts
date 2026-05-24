import { Connection, r } from "rethinkdb-ts";
import { AuditScope } from "@inkvisitor/shared/types";
import { DbEnums } from "@inkvisitor/shared/enums";
import { IJob } from ".";

const BATCH_SIZE = 500;

function toPolymorphicDoc(
  doc: Record<string, unknown>
): Record<string, unknown> | null {
  if (doc.modelId != null && doc.auditScope != null) return null;
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
    return null;
  }
  const out: Record<string, unknown> = { ...doc, modelId, auditScope };
  delete out.entityId;
  delete out.documentId;
  return out;
}

const replaceAuditsPolymorphicJob: IJob = async (db: Connection): Promise<void> => {
  const table = r.table("audits");
  const cursor = await table.run(db);
  let updated = 0;
  let batch: Array<Record<string, unknown>> = [];

  for await (const row of cursor) {
    const doc = row as Record<string, unknown>;
    const replaced = toPolymorphicDoc(doc);
    if (replaced == null) continue;
    batch.push(replaced);
    if (batch.length >= BATCH_SIZE) {
      for (const item of batch) {
        await table.get(item.id as string).replace(item).run(db);
        updated++;
      }
      console.log(`Replaced ${updated} audit rows...`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    for (const item of batch) {
      await table.get(item.id as string).replace(item).run(db);
      updated++;
    }
  }
  console.log(`Replace complete: ${updated} audit rows.`);

  const indexList = (await table.indexList().run(db)) as string[];
  if (!indexList.includes(DbEnums.Indexes.AuditScopeModelId)) {
    await table
      .indexCreate(DbEnums.Indexes.AuditScopeModelId, [
        r.row("auditScope"),
        r.row("modelId"),
      ])
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

export default replaceAuditsPolymorphicJob;
