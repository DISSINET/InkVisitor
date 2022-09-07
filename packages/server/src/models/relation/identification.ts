import { EntityEnums, RelationEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

export default class Identification extends Relation implements RelationTypes.IIdentification {
  certainty: EntityEnums.Certainty;
  type: RelationEnums.Type.Identification;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.certainty = data.certainty as EntityEnums.Certainty;
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Identification;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    if (!EnumValidators.IsValidEntityCertainty(this.certainty)) {
      return false
    }

    return true;
  }
}
