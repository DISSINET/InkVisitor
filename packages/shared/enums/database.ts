export namespace DbEnums {
    export enum Indexes {
        Class = "class",
        StatementTerritory = "statement_territory",
        StatementEntities = "statement_entities",
        StatementActantsCI = "statement_actants_CI",
        StatementDataProps = "statement.data_props_recursive",
        AuditEntityId = "entityId",
        EntityUsedTemplate = "usedTemplate",
        PropsRecursive = "props.recursive",
        RelationsEntityIds = "entityIds"
    }

    export const EntityIdReferenceIndexes = [
      Indexes.PropsRecursive,
      Indexes.StatementDataProps,
      Indexes.StatementEntities,
      Indexes.StatementActantsCI,
    ]
}
