import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";

export default class SubjectActant1Reciprocal extends Relation implements RelationTypes.ISubjectActant1Reciprocal {
  type: RelationEnums.Type.SubjectActant1Reciprocal;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.ISubjectActant1Reciprocal>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SubjectActant1Reciprocal;
  }

  static async getSubjectActant1ReciprocalForwardConnections (
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.ISubjectActant1Reciprocal>[]> {
    let out: RelationTypes.IConnection<RelationTypes.ISubjectActant1Reciprocal>[] = [];
  
    if (asClass === EntityEnums.Class.Action) {
      out = await Relation.getForEntity<RelationTypes.ISubjectActant1Reciprocal>(
        conn,
        entityId,
        RelationEnums.Type.SubjectActant1Reciprocal,
      );
    }
  
    return out;
  };
  
}