import { UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import Relation from "./relation";

export default class Identification extends Relation {
  certainty: EntityEnums.Certainty;

  constructor(data: UnknownObject) {
    super(data);

    this.certainty = data?.certainty as EntityEnums.Certainty;
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
