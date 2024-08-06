import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";

export default class Related
  extends Relation
  implements RelationTypes.IRelated
{
  type: RelationEnums.Type.Related;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IRelated>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Related;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  /**
   * tests if entities data are acceptable, for now tests only if entities are not templates & IsPLOGESTRB
   * issue #1271
   * @returns
   */
  validateEntitiesData(): Error | null {
    for (const i in this.entityIds) {
      const loadedEntity = this.entities?.find(
        (e) => e.id === this.entityIds[i]
      );
      if (!loadedEntity) {
        return new InternalServerError(
          "",
          "cannot check entity's class - not preloaded"
        );
      }

      if (
        !EntityEnums.IsPLOGESTRB(loadedEntity.class) &&
        loadedEntity.isTemplate
      ) {
        return new ModelNotValidError(
          `Entity ${loadedEntity.id} must not be a template`
        );
      }
    }

    return null;
  }

  static async getRelatedForwardConnections(
    conn: Connection,
    parentId: string
  ): Promise<RelationTypes.IRelated[]> {
    const out: RelationTypes.IRelated[] = await Relation.findForEntities(
      conn,
      [parentId],
      RelationEnums.Type.Related
    );

    // sort by order
    out.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );

    return out;
  }
}
