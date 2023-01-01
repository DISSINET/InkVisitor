import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class Antonym extends Relation implements RelationTypes.IAntonym {
  type: RelationEnums.Type.Antonym;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IAntonym>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Antonym;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getAntonymForwardConnections(
    conn: Connection,
    entityId: string
  ): Promise<RelationTypes.IConnection<RelationTypes.IAntonym>[]> {
    const out: RelationTypes.IConnection<RelationTypes.IAntonym>[] =
      await Relation.getForEntity<RelationTypes.IAntonym>(
        conn,
        entityId,
        RelationEnums.Type.Antonym,
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