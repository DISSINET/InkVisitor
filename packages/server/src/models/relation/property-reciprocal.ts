import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class PropertyReciprocal extends Relation implements RelationTypes.IPropertyReciprocal {
  type: RelationEnums.Type.PropertyReciprocal;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IPropertyReciprocal>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.PropertyReciprocal;
  }

  static async getPropertyReciprocalForwardConnections (
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.IPropertyReciprocal>[]> {
    let out: RelationTypes.IConnection<RelationTypes.IPropertyReciprocal>[] = [];
  
    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity<RelationTypes.IPropertyReciprocal>(
        conn,
        entityId,
        RelationEnums.Type.PropertyReciprocal
      );
    }
  
    return out;
  };
}