import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class Related extends Relation implements RelationTypes.IRelated {
  type: RelationEnums.Type.Related;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IRelated>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Related;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  static async getRelatedForwardConnections (
    conn: Connection,
    parentId: string
  ): Promise<RelationTypes.IRelated[]> {
    const out: RelationTypes.IRelated[] = await Relation.getForEntity(
      conn,
      parentId,
      RelationEnums.Type.Related,
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