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
    RelationsEntityIds = "entityIds",
    DocumentEntityIds = "entityIds"
  }

  export const EntityIdReferenceIndexes = [
    Indexes.PropsRecursive,
    Indexes.StatementDataProps,
    Indexes.StatementEntities,
    Indexes.StatementActantsCI,
  ]
}
