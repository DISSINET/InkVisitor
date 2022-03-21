import { UnknownObject, IModel } from "@models/common";
import { EntityClass, EntityStatus } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IConcept, IEntity } from "@shared/types";

class ConceptData implements IModel {
  status: EntityStatus = EntityStatus.Pending;
  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    // TODO: If admin ? model.status = EntityStatus.Approved : model.status = EntityStatus.Pending
  }

  isValid(): boolean {
    return true;
  }
}

class Concept extends Entity implements IConcept {
  class: EntityClass.Concept = EntityClass.Concept; // just default
  data: ConceptData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ConceptData({} as UnknownObject);
  }

  isValid(): boolean {
    const alloweedClasses = [EntityClass.Concept];

    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Concept;
