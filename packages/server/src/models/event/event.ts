import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityClass, EntityLogicalType } from "@shared/enums";
import { IEvent } from "@shared/types";

class EventData implements IModel {
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

class Event extends Entity implements IEvent {
  class: EntityClass.Event = EntityClass.Event; // just default
  data: EventData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new EventData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityClass.Event) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Event;
