import { UnknownObject, IModel } from "@models/common";
import { EntityClass } from "@shared/enums";
import Actant from "@models/actant/actant";
import { IEntity } from "@shared/types";

class ConceptData implements IModel {
  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Concept extends Actant implements IEntity {
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
