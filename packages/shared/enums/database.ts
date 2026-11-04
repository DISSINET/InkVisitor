export namespace DbEnums {
  export enum Indexes {
    Class = "class",
    StatementTerritory = "statement_territory",
    StatementEntities = "statement_entities",
    StatementActantsCI = "statement_actants_CI",
    StatementDataProps = "statement.data_props_recursive",
    AuditScopeModelId = "auditScope_modelId",
    AuditDate = "date",
    AuditDateTypeUser = "date_type_user",
    AuditRelationEntityIds = "relation_entityIds",
    EntityUsedTemplate = "usedTemplate",
    EntityReferences = "references.entityIds",
    PropsRecursive = "props.recursive",
    // index names are scoped to their table, so the documents table has its own
    // "entityIds" index next to the relations one
    // oxlint-disable-next-line typescript/no-duplicate-enum-values
    RelationsEntityIds = "entityIds",
    DocumentEntityIds = "entityIds"
  }

  export const EntityIdReferenceIndexes = [
    Indexes.PropsRecursive,
    Indexes.StatementDataProps,
    Indexes.StatementEntities,
    Indexes.StatementActantsCI,
    Indexes.EntityReferences,
  ]
}
