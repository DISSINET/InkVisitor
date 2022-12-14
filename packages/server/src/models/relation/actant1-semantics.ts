import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";

export default class Actant1Semantics extends Relation implements RelationTypes.IActant1Semantics {
  type: RelationEnums.Type.Actant1Semantics;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IActant1Semantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Actant1Semantics;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getActant1SemanticsForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.IActant1Semantics>[]> {
    let out: RelationTypes.IActant1Semantics[] = [];

    if (asClass === EntityEnums.Class.Action) {
      out = await Relation.getForEntity(
        conn,
        entityId,
        RelationEnums.Type.Actant1Semantics,
        0
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

  static async getActant1SemanticsInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IActant1Semantics[]> {
    let out: RelationTypes.IActant1Semantics[] = [];

    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Actant1Semantics,
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
