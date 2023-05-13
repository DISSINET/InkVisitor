import { getRelationClass } from "@models/factory";
import { RelationEnums } from "@shared/enums";
import { IRequest } from "src/custom_typings/request";
import Relation from "./relation";

/**
 * Recreates relations of chosen type(s) for another entity
 * @param request
 * @param originalEntity
 * @param targetEntity
 * @param types
 */
export const copyRelations = async (
  request: IRequest,
  originalEntity: string,
  targetEntity: string,
  types: RelationEnums.Type[]
): Promise<void> => {
  const relations = await Relation.findForEntity(
    request.db.connection,
    originalEntity
  );

  for (let i = 0; i < relations.length; i++) {
    const relation = getRelationClass(relations[i]);
    if (types.indexOf(relation.type) === -1) {
      continue;
    }

    // relation should be created anew
    relation.id = "";

    // replace template id with this.id
    relation.entityIds = relation.entityIds.map((id) =>
      id === originalEntity ? targetEntity : id
    );

    await relation.beforeSave(request);
    await relation.save(request.db.connection);
    await relation.afterSave(request);
  }
};
