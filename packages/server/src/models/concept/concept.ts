import { UnknownObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IConcept } from "@shared/types";

class ConceptData implements IModel {
  status: EntityEnums.Status = EntityEnums.Status.Pending;
  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    // TODO: If admin ? model.status = EntityEnums.Status.Approved : model.status = EntityEnums.Status.Pending
  }

  isValid(): boolean {
    return true;
  }
}

class Concept extends Entity implements IConcept {
  class: EntityEnums.Class.Concept = EntityEnums.Class.Concept; // just default
  data: ConceptData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ConceptData({} as UnknownObject);
  }

  isValid(): boolean {
    const alloweedClasses = [EntityEnums.Class.Concept];

    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Concept;
