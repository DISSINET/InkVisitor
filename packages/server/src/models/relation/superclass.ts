import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";

export default class Superclass extends Relation implements RelationTypes.ISuperclass {
  type: RelationEnums.Type.Superclass;
  entityIds: [string, string];
  order: number;

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Superclass;
    this.order = data.order === undefined ? EntityEnums.Order.Last : data.order;
  }

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    let prevClass: EntityEnums.Class | undefined;
    for (const entityId of this.entityIds) {
      const entity = this.entities?.find(e => e.id === entityId);
      if (!entity) {
        throw new InternalServerError('', `cannot check entity's class - not preloaded`);
      }

      if (!this.hasEntityCorrectClass(entityId, [EntityEnums.Class.Action, EntityEnums.Class.Concept])) {
        return new ModelNotValidError(`Entity '${entityId}' mush have class '${EntityEnums.Class.Action}' or '${EntityEnums.Class.Concept}'`);
      }
      if (prevClass === undefined) {
        prevClass = entity.class;
      }

      if (prevClass !== entity.class) {
        return new ModelNotValidError("Entities must have equal classes");
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

    return true;
  }
}
