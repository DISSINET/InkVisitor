import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IAction } from "@shared/types";
import {
  IActionEntity,
  IActionValency,
  IActionData,
} from "@shared/types/action";

class ActionValency implements IActionValency, IModel {
  a1: string;
  a2: string;
  s: string;

  constructor(data: Partial<IActionValency>) {
    this.a1 = data.a1 || "";
    this.a2 = data.a2 || "";
    this.s = data.s || "";
  }

  isValid(): boolean {
    return (
      typeof this.a1 === "string" &&
      typeof this.a2 === "string" &&
      typeof this.s === "string"
    );
  }
}

class ActionEntity implements IActionEntity, IModel {
  a1: EntityEnums.Class[];
  a2: EntityEnums.Class[];
  s: EntityEnums.Class[];

  constructor(data: Partial<IActionEntity>) {
    this.a1 = data.a1 || [];
    this.a2 = data.a2 || [];
    this.s = data.s || [];
  }

  isValid(): boolean {
    return (
      this.a1.constructor.name === "Array" &&
      this.a2.constructor.name === "Array" &&
      this.s.constructor.name === "Array"
    );
  }
}

class ActionData implements IActionData, IModel {
  valencies: ActionValency;
  entities: ActionEntity;
  status: EntityEnums.Status = EntityEnums.Status.Pending;

  constructor(data: Partial<IActionData>) {
    this.valencies = new ActionValency(data.valencies || {});
    this.entities = new ActionEntity(data.entities || {});
  }

  isValid(): boolean {
    return this.valencies.isValid() && this.entities.isValid();
  }
}

class Action extends Entity implements IAction {
  class: EntityEnums.Class.Action = EntityEnums.Class.Action; // just default
  data: ActionData;

  constructor(data: Partial<IAction>) {
    super(data);
    this.data = new ActionData(data.data || {});
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Action) {
      return false;
    }

    return super.isValid() && this.data.isValid();
  }
}

export default Action;
