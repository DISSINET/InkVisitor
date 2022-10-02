import { IModel } from "@models/common";
import { EntityEnums, EnumValidators } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IAction } from "@shared/types";
import { IActionEntity, IActionValency, IActionData } from "@shared/types/action";

class ActionData implements IActionData, IModel {
  valencies: IActionValency;
  entities: IActionEntity
  status: EntityEnums.Status = EntityEnums.Status.Pending;

  constructor(data: Partial<IActionData>) {
    this.valencies = data.valencies as IActionValency;
    this.entities = data.entities as IActionEntity;
  }

  isValid(): boolean {
    if (!this.valencies || !this.valencies.a1 || !this.valencies.a2 || !this.valencies.s) {
      return false
    }

    if (!this.entities || !this.entities.a1 || !this.entities.a2 || !this.entities.s) {
      return false;
    }

    if (!EnumValidators.IsValidEntityStatus(this.status)) {
      return false;
    }

    return true;
  }
}

class Action extends Entity implements IAction {
  class: EntityEnums.Class.Action = EntityEnums.Class.Action;
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
