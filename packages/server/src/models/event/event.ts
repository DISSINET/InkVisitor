import Entity from "@models/entity/entity";
import { fillFlatObject, IModel, UnknownObject } from "@models/common";
import { EntityEnums } from "@shared/enums";
import { IEvent, IEventData } from "@shared/types";

class EventData implements IEventData, IModel {
  logicalType: EntityEnums.LogicalType = EntityEnums.LogicalType.Definite;

  constructor(data: Partial<IEventData>) {
    fillFlatObject(this, data);
  }

  isValid(): boolean {
    return true;
  }
}

class Event extends Entity implements IEvent {
  class: EntityEnums.Class.Event = EntityEnums.Class.Event; // just default
  data: EventData;

  constructor(data: Partial<IEvent>) {
    super(data);
    this.data = new EventData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Event) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Event;
