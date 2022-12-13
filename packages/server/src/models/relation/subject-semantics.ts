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
