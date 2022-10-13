import { RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class SubjectSemantics extends Relation implements RelationTypes.ISubjectSemantics {
  type: RelationEnums.Type.SubjectSemantics;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.SubjectSemantics;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    return true;
  }
}
