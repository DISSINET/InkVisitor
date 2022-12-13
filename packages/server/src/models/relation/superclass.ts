import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";

export default class Superclass extends Relation implements RelationTypes.ISuperclass {
  type: RelationEnums.Type.Superclass;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Superclass;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getSuperclassForwardConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.ISuperclass>[]> {
    const out: RelationTypes.IConnection<RelationTypes.ISuperclass>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IRelation[] = [];

    if (
      [EntityEnums.Class.Concept, EntityEnums.Class.Action].indexOf(asClass) !==
      -1
    ) {
      relations = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Superclass,
        0
      );
    } else if (EntityEnums.PLOGESTR.indexOf(asClass) !== -1) {
      relations = await Relation.getForEntity(
        conn,
        parentId,
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
      const connection: RelationTypes.IConnection<RelationTypes.ISuperclass> = {
        ...(relation as RelationTypes.ISuperclass),
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

  static async getSuperclassInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.ISuperclass[]> {
    let out: RelationTypes.ISuperclass[] = [];

    if (
      asClass === EntityEnums.Class.Action ||
      asClass === EntityEnums.Class.Concept
    ) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Superclass,
        1
      );
    }

    // sort by order
    out.sort(
      (a, b) =>
        (a.order === undefined ? EntityEnums.Order.Last : a.order) -
        (b.order === undefined ? EntityEnums.Order.Last : b.order)
    );

    return out;
  };
}
