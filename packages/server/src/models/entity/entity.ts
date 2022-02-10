import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import {
  ActantType,
  EntityActantType,
  EntityLogicalType,
} from "@shared/enums";
import { IEntity } from "@shared/types/entity";
import Actant from "@models/actant/actant";

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

  class: EntityActantType = ActantType.Person; // just default
  data: EntityData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.class = data.class as EntityActantType;
    this.data = new EntityData(data.data as UnknownObject);
  }

  isValid(): boolean {
    const alloweedClasses = [
      ActantType.Person,
      ActantType.Group,
      ActantType.Object,
      ActantType.Location,
      ActantType.Value,
      ActantType.Event,
    ];
    if (alloweedClasses.indexOf(this.class) === -1) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Entity;
