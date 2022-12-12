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

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    if (!this.hasEntityCorrectClass(this.entityIds[0], [EntityEnums.Class.Action])) {
      return new ModelNotValidError(`First entity should be of class '${EntityEnums.Class.Action}'`);
    }

    if (!this.hasEntityCorrectClass(this.entityIds[1], [EntityEnums.Class.Concept])) {
      return new ModelNotValidError(`Second entity should be of class '${EntityEnums.Class.Concept}'`);
    }

    return null;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    if (this.entityIds.length !== 2) {
      return false;
    }

    return true;
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
