import Actant from "@models/actant/actant";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityClass, EntityLogicalType } from "@shared/enums";
import { IEntity } from "@shared/types/entity";

class EntityData implements IModel {
  logicalType: EntityLogicalType = EntityLogicalType.Definite;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Entity extends Actant implements IEntity {
  static table = "actants";
  static publicFields = Actant.publicFields;

  class: EntityClass = EntityClass.Person; // just default
  data: EntityData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.class = data.class as EntityClass;
    this.data = new EntityData(data.data as UnknownObject);
  }

  isValid(): boolean {
    const alloweedClasses = [
      EntityClass.Person,
      EntityClass.Group,
      EntityClass.Object,
      EntityClass.Location,
      EntityClass.Value,
      EntityClass.Event,
    ];
    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Entity;
