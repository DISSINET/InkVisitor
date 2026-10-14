import { DbEnums } from "@inkvisitor/shared/enums";

/**
 * Indexes the server depends on at request time. If any of these are
 * missing the corresponding route throws a runtime error - we'd rather
 * fail-fast at boot with an actionable message. The adapter checks this
 * list at startup against indexList().
 *
 * Adding a new dependency? Add an entry here and declare the index in the
 * catalogue in rethink/provision.ts; the operator-run ensureIndexesJob in
 * packages/database creates missing ones from it.
 */
export interface RequiredIndex {
  table: string;
  index: string;
  usedBy: string;
}

export const REQUIRED: RequiredIndex[] = [
  // The entity-detail response (ResponseEntityDetail.prepare) and the delete
  // guard (Entity.getUsedByEntity) reach all of these via getAll():
  // Entity.findUsedInProps / findUsedInReferences plus
  // Statement.getLinkedEntities / findByDataPropsId / findByDataActantsCI.
  // Reuse the canonical entity-id reference set so any index added there is
  // covered here automatically.
  ...DbEnums.EntityIdReferenceIndexes.map((index) => ({
    table: "entities",
    index,
    usedBy: "entity-detail response / delete guard (getAll)",
  })),
  {
    table: "entities",
    index: DbEnums.Indexes.StatementTerritory,
    usedBy: "Statement.findStatementsInTerritory (territory statements list)",
  },
  {
    table: "documents",
    index: DbEnums.Indexes.DocumentEntityIds,
    usedBy: "Document.findByEntityId (entity tooltip/detail usedInDocuments, delete check)",
  },
  {
    table: "audits",
    index: DbEnums.Indexes.AuditRelationEntityIds,
    usedBy: "Audit.getRelationAuditsForEntity (entity-detail relation audits)",
  },
];
