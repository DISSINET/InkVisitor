import { fillFlatObject, UnknownObject, IModel, fillArray } from "./common";
import {
  ActantType,
  EntityActantType,
  ActantStatus,
  EntityLogicalType,
} from "@shared/enums";
import { IEntity } from "@shared/types/entity";
import Actant from "./actant";

class EntityData implements IModel {
  logicalType: EntityLogicalType = EntityLogicalType.Definite;
  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Entity extends Actant implements IEntity {
  static table = "actants";

  class: EntityActantType = ActantType.Person; // just default
  data: EntityData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

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
