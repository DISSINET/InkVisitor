import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { ModelNotValidError } from "@shared/types/errors";

export default class Implication extends Relation implements RelationTypes.IImplication {
  type: RelationEnums.Type.Implication;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IImplication>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Implication;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getImplicationForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.IImplication>[]> {
    let out: RelationTypes.IImplication[] = [];

    if (asClass === EntityEnums.Class.Action) {
      out = await Relation.getForEntity(
        conn,
        entityId,
        RelationEnums.Type.Implication,
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

  static async getImplicationInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IImplication[]> {
    let out: RelationTypes.IImplication[] = [];

    if (asClass === EntityEnums.Class.Action) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.Implication,
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