import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class Holonym extends Relation implements RelationTypes.IHolonym {
  type: RelationEnums.Type.Holonym;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IHolonym>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Holonym;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getHolonymForwardConnections (
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.IHolonym>[]> {
    let out: RelationTypes.IConnection<RelationTypes.IHolonym>[] = [];
  
    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity<RelationTypes.IHolonym>(
        conn,
        entityId,
        RelationEnums.Type.Holonym,
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
  
  static async  getHolonymInverseConnections (
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.IHolonym>[]> {
    let out: RelationTypes.IConnection<RelationTypes.IHolonym>[] = [];
  
    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity<RelationTypes.IHolonym>(
        conn,
        entityId,
        RelationEnums.Type.Holonym,
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