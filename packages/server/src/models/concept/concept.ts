import { UnknownObject, IModel } from "@models/common";
import { EntityClass, EntityStatus } from "@shared/enums";
import Actant from "@models/actant/actant";
import { IConcept, IEntity } from "@shared/types";

class ConceptData implements IModel {
  status: EntityStatus = EntityStatus.Pending;
  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    // TODO: If admin ? model.status = ActantStatus.Approved : model.status = ActantStatus.Pending
  }

  isValid(): boolean {
    return true;
  }
}

class Concept extends Actant implements IConcept {
  static table = "actants";
  static publicFields = Actant.publicFields;

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

    console.log();
    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Concept;
