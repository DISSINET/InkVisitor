import { IModel } from "@models/common";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { IAction } from "@shared/types";
import {
  IActionEntity,
  IActionValency,
  IActionData,
} from "@shared/types/action";

export class ActionValency implements IActionValency, IModel {
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

export class ActionEntity implements IActionEntity, IModel {
  a1?: EntityEnums.ExtendedClass[];
  a2?: EntityEnums.ExtendedClass[];
  s?: EntityEnums.ExtendedClass[];

  constructor(data: Partial<IActionEntity>) {
    this.a1 = data.a1 || undefined;
    this.a2 = data.a2 || undefined;
    this.s = data.s || undefined;
  }

  /**
   * predicate function for validating single field
   * @param field
   * @returns
   */
  static isFieldValid(field: unknown): boolean {
    if (!field) {
      return true;
    }

    if (field.constructor.name !== "Array") {
      return false;
    }

    if ((field as unknown[]).find((v) => !EntityEnums.IsExtendedClass(v))) {
      return false;
    }

    return true;
  }

  /**
   * predicate function for testing validity of the whole ActionEntity instance
   * @returns
   */
  isValid(): boolean {
    if (
      !ActionEntity.isFieldValid(this.a1) ||
      !ActionEntity.isFieldValid(this.a2) ||
      !ActionEntity.isFieldValid(this.s)
    ) {
      return false;
    }

    return true;
  }

  static toRules(
    ae: IActionEntity
  ): Record<EntityEnums.Position, EntityEnums.ExtendedClass[] | undefined> {
    return {
      a1: ae.a1,
      a2: ae.a2,
      s: ae.s,
      pa: [],
    };
  }
}

class ActionData implements IActionData, IModel {
  valencies: ActionValency;
  entities: ActionEntity;
  pos: EntityEnums.ActionPartOfSpeech = EntityEnums.ActionPartOfSpeech.Verb;

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
