import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Superclass from "./superclass";
import { ModelNotValidError } from "@shared/types/errors";

export default class Classification extends Relation implements RelationTypes.IClassification {
  type: RelationEnums.Type.Classification;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IClassification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Classification;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getClassificationForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<
    RelationTypes.IConnection<RelationTypes.IClassification, RelationTypes.ISuperclass>[]> {
    const out: RelationTypes.IConnection<RelationTypes.IClassification, RelationTypes.ISuperclass>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IClassification[] = [];

    if (nestLvl === 0 && EntityEnums.PLOGESTRB.indexOf(asClass) !== -1) {
      relations = await Relation.getForEntity(
        conn,
        entityId,
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

      connection.subtrees = await Superclass.getSuperclassForwardConnections(
        conn,
        subparentId,
        EntityEnums.Class.Concept,
        maxNestLvl,
        nestLvl + 1
      );
      out.push(connection);
    }

    return out;
  };

  static async getClassificationInverseConnections(
    conn: Connection,
    parentId: string
  ): Promise<RelationTypes.IClassification[]> {
    const out: RelationTypes.IClassification[] = await Relation.getForEntity(
      conn,
      parentId,
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
  };
}