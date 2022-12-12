import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";

export default class SubjectSemantics extends Relation implements RelationTypes.ISubjectSemantics {
  type: RelationEnums.Type.SubjectSemantics;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.ISubjectSemantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SubjectSemantics;
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

  static async getSubjectSemanticsForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.ISubjectSemantics>[]> {
    let out: RelationTypes.ISubjectSemantics[] = [];

    if (asClass === EntityEnums.Class.Action) {
      out = await Relation.getForEntity(
        conn,
        entityId,
        RelationEnums.Type.SubjectSemantics,
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

  static async getSubjectSemanticsInverseConnections(
    conn: Connection,
    parentId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.ISubjectSemantics[]> {
    let out: RelationTypes.ISubjectSemantics[] = [];

    if (asClass === EntityEnums.Class.Concept) {
      out = await Relation.getForEntity(
        conn,
        parentId,
        RelationEnums.Type.SubjectSemantics,
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
