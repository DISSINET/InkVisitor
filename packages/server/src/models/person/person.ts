import Entity from "@models/entity/entity";
import { fillFlatObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IPerson, IPersonData } from "@shared/types";

class PersonData implements IPersonData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<IPersonData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Person extends Entity implements IPerson {
  class: EntityEnums.Class.Person = EntityEnums.Class.Person; // just default
  data: PersonData;

  constructor(data: Partial<IPerson>) {
    super(data);
    this.data = new PersonData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Person) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Person;
