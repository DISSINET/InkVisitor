import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";

export default class Actant1Semantics extends Relation implements RelationTypes.IActant1Semantics {
  type: RelationEnums.Type.Actant1Semantics;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IActant1Semantics>) {
    super(data);
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Actant1Semantics;
  }

  /**
  * areEntitiesValid checks if entities have acceptable classes
  * @returns 
  */
  areEntitiesValid(): Error | null {
    if (this.entityIds.length !== 2) {
      return new ModelNotValidError("# of entities should be 2");
    }

    if (this.entities?.find(e => e.id === this.entityIds[0])?.class !== EntityEnums.Class.Action) {
      return new ModelNotValidError(`First entity should of class '${EntityEnums.Class.Action}'`);
    }

    if (this.entities?.find(e => e.id === this.entityIds[1])?.class !== EntityEnums.Class.Concept) {
      return new ModelNotValidError(`Second entity should of class '${EntityEnums.Class.Concept}'`);
    }

    return null;
  }
}
