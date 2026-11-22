import { Relation } from "@inkvisitor/shared/types";
import { Query } from "@inkvisitor/shared/types/query";
import { IResponseQueryExportJson } from "@inkvisitor/shared/types/response-query";
import { buildEntityJsonFromRelations } from "utils/entityImport";

interface ExplorerJsonExportMeta {
  exportedAt: string;
  version: string;
  /** the query whose results the entities were selected from */
  query: Query.INode;
}

/**
 * The file of the Explorer JSON export: the entities in the shape of the JSON
 * in Detail, in the order of `entityIds`, followed by their audits as stored.
 */
export const buildExplorerJsonExport = (
  response: IResponseQueryExportJson,
  entityIds: string[],
  meta: ExplorerJsonExportMeta
) => {
  const relationsByEntity = new Map<string, Relation.IRelation[]>(
    entityIds.map((id) => [id, []])
  );
  for (const relation of response.relations) {
    for (const entityId of new Set(relation.entityIds)) {
      relationsByEntity.get(entityId)?.push(relation);
    }
  }

  const entitiesById = new Map(response.entities.map((entity) => [entity.id, entity]));

  return {
    ...meta,
    entities: entityIds.flatMap((id) => {
      const entity = entitiesById.get(id);
      return entity ? [buildEntityJsonFromRelations(entity, relationsByEntity.get(id) ?? [])] : [];
    }),
    audits: response.audits,
  };
};
