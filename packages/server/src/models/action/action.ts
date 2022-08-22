import { fillFlatObject, UnknownObject, IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IAction } from "@shared/types";
import { ActionEntity, ActionValency } from "@shared/types/action";

class ActionData implements IModel {
  valencies: ActionValency = {
    a1: "",
    a2: "",
    s: "",
  };
  entities: ActionEntity = {
    a1: [],
    a2: [],
    s: [],
  };
  status: EntityEnums.Status = EntityEnums.Status.Pending;

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this.valencies, data.valencies as any);
    if (data.entities) {
      this.entities = data.entities as any;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Action extends Entity implements IAction {
  class: EntityEnums.Class.Action = EntityEnums.Class.Action; // just default
  data: ActionData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ActionData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== EntityEnums.Class.Action) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Action;
