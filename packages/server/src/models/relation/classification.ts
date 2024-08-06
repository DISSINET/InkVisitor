import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Superclass from "./superclass";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";

export default class Classification
  extends Relation
  implements RelationTypes.IClassification
{
  type: RelationEnums.Type.Classification;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IClassification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Classification;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  /**
   * tests if entities data are acceptable, classification cant be used if going non-template -> template
   * issue #1271
   * @returns
   */
  validateEntitiesData(): Error | null {
    for (let i = 0; i < this.entityIds.length; i++) {
      const loadedEntity = this.entities?.find(
        (e) => e.id === this.entityIds[i]
      );
      if (!loadedEntity) {
        return new InternalServerError(
          "",
          "cannot check entity's class - not preloaded"
        );
      }

      if (i > 0 && loadedEntity.isTemplate) {
        return new ModelNotValidError(
          `Entity ${loadedEntity.id} must not be a template`
        );
      }
    }

    return null;
  }

  static async getForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<
    RelationTypes.IConnection<
      RelationTypes.IClassification,
      RelationTypes.ISuperclass
    >[]
  > {
    const out: RelationTypes.IConnection<
      RelationTypes.IClassification,
      RelationTypes.ISuperclass
    >[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IClassification[] = [];

    if (nestLvl === 0 && EntityEnums.PLOGESTRBV.indexOf(asClass) !== -1) {
      relations = await Relation.findForEntities(
        conn,
        [entityId],
        RelationEnums.Type.Classification,
        0
      );
    }

    // sort by order
    relations.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );

    for (const relation of relations) {
      const subparentId = relation.entityIds[1];
      const connection: RelationTypes.IConnection<
        RelationTypes.IClassification,
        RelationTypes.ISuperclass
      > = {
        ...relation,
        subtrees: [],
      };

      connection.subtrees = await Superclass.getForwardConnections(
        conn,
        subparentId,
        EntityEnums.Class.Concept,
        maxNestLvl,
        nestLvl + 1
      );
      out.push(connection);
    }

    return out;
  }

  static async getInverseConnections(
    conn: Connection,
    parentId: string
  ): Promise<RelationTypes.IClassification[]> {
    const out: RelationTypes.IClassification[] = await Relation.findForEntities(
      conn,
      [parentId],
      RelationEnums.Type.Classification,
      1
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
