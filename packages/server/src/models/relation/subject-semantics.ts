import { RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class SubjectSemantics extends Relation implements RelationTypes.ISubjectSemantics {
  type: RelationEnums.Type.SubjectSemantics;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.ISubjectSemantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SubjectSemantics;
  }
}
