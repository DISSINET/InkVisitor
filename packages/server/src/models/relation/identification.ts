import { EntityEnums, RelationEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";

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
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    for (const entityId of this.entityIds) {
      if (!this.hasEntityCorrectClass(entityId, EntityEnums.PLOGESTRB)) {
        return new ModelNotValidError(`Entity '${entityId}' does not have valid class`);
      }
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

    if (!EnumValidators.IsValidEntityCertainty(this.certainty)) {
      return false;
    }

    return true;
  }
}
