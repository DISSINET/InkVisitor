import { fillFlatObject, UnknownObject, IModel } from "./common";
import { ActantType, ActantStatus } from "@shared/enums";
import Actant from "./actant";
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
  properties: any[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }
  }

  isValid(): boolean {
    return true;
  }
}

class Action extends Actant implements IAction {
  static table = "actants";

  class: ActantType.Action = ActantType.Action; // just default
  data: ActionData;

  constructor(data: UnknownObject) {
    super(data);

    if (!data) {
      data = {};
    }

    this.data = new ActionData(data.data as UnknownObject);
  }

  isValid(): boolean {
    if (this.class !== ActantType.Action) {
      return false;
    }

    return this.data.isValid();
  }
}

export default Action;
