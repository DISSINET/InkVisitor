import { ActionEntity } from "@models/action/action";
import { EntityEnums } from "@shared/enums";
import { IAction } from "@shared/types";

export class PositionRules {
  classes: EntityEnums.ExtendedClass[] = [];
  undefinedActions: string[] = [];
  allUndefined = true;
  mismatch = false;

  constructor(actions: IAction[], position: EntityEnums.Position) {
    for (const action of actions) {
      const rules = ActionEntity.toRules(action.data.entities)[position];
      const emptyRules = !rules || !rules.length;
      if (emptyRules) {
        this.undefinedActions.push(action.id);
      }

      this.allUndefined = this.allUndefined && emptyRules;

      this.classes = this.classes.concat(rules || []);
    }
  }

  /**
   * Predicate for testing if current rules-set allows empty actant
   * @returns
   */
  allowsEmpty(): boolean {
    return this.classes.includes(EntityEnums.Extension.Empty);
  }

  /**
   * Tests if arrays of allowed classes across actions has any intersection
   * @param rules
   * @returns
   */
  static hasIntersection(
    rules: (EntityEnums.ExtendedClass[] | undefined)[]
  ): boolean {
    if (!Array.isArray(rules) || rules.length < 2) {
      return true;
    }

    let intersection = rules[0] || [];

    for (let i = 1; i < rules.length; i++) {
      const currentArray = rules[i] || [];

      intersection = (intersection || []).filter((element) =>
        currentArray.includes(element)
      );
    }

    return intersection.length > 0;
  }

  /**
   * Tests if some rule disallows any actant
   * @param rules
   * @returns
   */
  static allowsOnlyEmpty(
    rules: EntityEnums.ExtendedClass[] | undefined
  ): boolean {
    return (
      !!rules && rules.length === 1 && rules[0] === EntityEnums.Extension.Empty
    );
  }
}
