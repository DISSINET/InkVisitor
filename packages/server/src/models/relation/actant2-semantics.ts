import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";

export default class Actant2Semantics extends Relation implements RelationTypes.IActant2Semantics {
  type: RelationEnums.Type.Actant2Semantics;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IActant2Semantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Actant2Semantics;
    this.order = data.order || EntityEnums.Order.Last;
  }

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    if (!this.hasEntityCorrectClass(this.entityIds[0], [EntityEnums.Class.Action])) {
      return new ModelNotValidError(`First entity should of class '${EntityEnums.Class.Action}'`);
    }

    if (!this.hasEntityCorrectClass(this.entityIds[1], [EntityEnums.Class.Concept])) {
      return new ModelNotValidError(`Second entity should of class '${EntityEnums.Class.Concept}'`);
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
}
