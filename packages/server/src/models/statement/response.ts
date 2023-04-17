import { EntityEnums, StatementEnums, UserEnums } from "@shared/enums";
import {
  IAction,
  IEntity,
  IProp,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import {
  IWarning,
  IWarningPosition,
  OrderType,
} from "@shared/types/response-statement";

import { WarningTypeEnums } from "@shared/enums";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";
import Entity from "../entity/entity";
import { InternalServerError } from "@shared/types/errors";
import Action, { ActionEntity } from "@models/action/action";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity };
  elementsOrders: OrderType[];
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;
  warnings: IWarning[];

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
    this.elementsOrders = [];
    this.warnings = [];
  }

  async prepare(req: IRequest) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    this.prepareEntities(req.db.connection);
    this.elementsOrders = this.prepareElementsOrders();
    this.warnings = this.getWarnings();
  }

  /**
   * Prepares the entities map
   * @param db
   */
  async prepareEntities(db: Connection): Promise<void> {
    const entities = await this.getEntities(db);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
  }

  /**
   * Returns list of supported entity classes from actions valencies
   * @returns list of classes
   */
  getSubjectETypes(): EntityEnums.Class[] {
    return this.data.actions
      .map((a) => a.actionId)
      .filter(
        (aid) =>
          this.entities[aid] &&
          this.entities[aid].class === EntityEnums.Class.Action
      )
      .reduce<EntityEnums.Class[]>(
        (acc, aid) =>
          acc.concat((this.entities[aid] as IAction).data.entities.s),
        []
      );
  }

  /**
   * Shorthand for creating new statement warning
   * @param warningType
   * @param position
   * @returns new instance of warning
   */
  newStatementWarning(
    warningType: WarningTypeEnums,
    position: IWarningPosition
  ): IWarning {
    return {
      type: warningType,
      message: "",
      origin: this.id,
      position,
    };
  }

  getEntity(id: string): IEntity {
    const entity = this.entities[id];
    if (!entity) {
      throw new InternalServerError(`Entity ${id} not preloaded`);
    }

    return entity;
  }

  /**
   * Check allowed entity classes for subject / actant1 / actant2 position based on action valencies and adds it to warnings field
   * @param warnings
   * @param position
   * @param warningType
   */
  checkValencyClassesForPosition(
    position: EntityEnums.Position,
    warningType: WarningTypeEnums
  ): IWarning[] {
    const warnings: IWarning[] = [];

    let allowedClasses: EntityEnums.ExtendedClass[] = [];

    this.data.actions
      .map((a) => a.actionId)
      .forEach((aid) => {
        const actionEntities = (this.getEntity(aid) as IAction).data
          .entities as Record<EntityEnums.Position, EntityEnums.Class[]>;
        allowedClasses = allowedClasses.concat(actionEntities[position]);
      });

    this.data.actants
      .filter((a) => a.position === position)
      .forEach((a) => {
        const entity = this.entities[a.entityId];
        if (entity && !allowedClasses.includes(entity.class)) {
          warnings.push(
            this.newStatementWarning(warningType, {
              section: `editor.${position}`,
              entityId: a.entityId,
              actantId: a.id,
            })
          );
        }
      });

    return warnings;
  }

  /**
   * get a list of all warnings
   */
  getWarnings(): IWarning[] {
    const warnings: IWarning[] = [];

    if (!this.data.actions.length) {
      warnings.push(this.newStatementWarning(WarningTypeEnums.NA, {}));
      return warnings;
    }

    for (const stActionIndex in this.data.actions) {
      const stAction = this.data.actions[stActionIndex];
      const action = this.getEntity(stAction.actionId) as Action;
      const rules = ActionEntity.toRules(action.data.entities);

      for (const position of [
        EntityEnums.Position.Actant1,
        EntityEnums.Position.Actant2,
        EntityEnums.Position.Subject,
      ]) {
        const actants = this.data.actants.filter(
          (a) => a.position === position
        );

        let commonWarn: WarningTypeEnums | undefined;
        if (rules[position] && rules[position].length && !actants.length) {
          commonWarn = WarningTypeEnums.MA;
        }

        for (const stActant of actants) {
          const actant = this.getEntity(stActant.entityId);
          const position = stActant.position;

          // rule supported - ok
          if (rules[position].includes(actant.class)) {
            commonWarn = undefined;
          } else if (!rules[position] || !rules[position].length) {
            warnings.push(
              this.newStatementWarning(WarningTypeEnums.ANA, {
                section: `editor.${position}`,
                actantId: stActant.id,
                entityId: stActant.entityId,
              })
            );
          } else {
            warnings.push(
              this.newStatementWarning(WarningTypeEnums.WA, {
                section: `editor.${position}`,
                actantId: stActant.id,
                entityId: stActant.entityId,
              })
            );
          }
        }

        if (commonWarn) {
          warnings.push(
            this.newStatementWarning(commonWarn, {
              section: `editor.${position}`,
            })
          );
        }
      }
    }

    /*const subjectETypes = this.getSubjectETypes();

    // Check allowed entity classes for subject position based on action valencies
    this.data.actants
      .filter((a) => a.position === EntityEnums.Position.Subject)
      .forEach((a) => {
        const entity = this.entities[a.entityId];
        if (entity && !subjectETypes.includes(entity.class)) {
          warnings.push(
            this.newStatementWarning(WarningTypeEnums.SValency, {
              section: "editor.subject",
              entityId: a.entityId,
              actantId: a.id,
            })
          );
        }
      });

    warnings = warnings.concat(
      this.checkValencyClassesForPosition(
        EntityEnums.Position.Subject,
        WarningTypeEnums.SValency
      )
    );
    warnings = warnings.concat(
      this.checkValencyClassesForPosition(
        EntityEnums.Position.Actant1,
        WarningTypeEnums.A1Valency
      )
    );
    warnings = warnings.concat(
      this.checkValencyClassesForPosition(
        EntityEnums.Position.Actant2,
        WarningTypeEnums.A2Valency
      )
    );
*/
    return warnings;
  }

  /**
   * fills values for elementsOrders array + sort them afterwards
   */
  prepareElementsOrders(): OrderType[] {
    /// unsorted items here
    const temp: OrderType[] = [];

    // statement.props
    Entity.extractIdsFromProps(this.props, (prop: IProp) => {
      temp.push({
        type: StatementEnums.ElementType.Prop,
        propValueId: prop.value.entityId,
        propTypeId: prop.type.entityId,
        originId: this.id,
        elementId: prop.id,
        order: prop.statementOrder !== undefined ? prop.statementOrder : false,
      });
    });

    // statement.actions
    for (const action of this.data.actions) {
      temp.push({
        type: StatementEnums.ElementType.Action,
        entityId: action.actionId,
        elementId: action.id,
        order: action.statementOrder,
      });

      // statement.actions.props
      Entity.extractIdsFromProps(action.props, (prop: IProp) => {
        temp.push({
          type: StatementEnums.ElementType.Prop,
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: action.actionId,
          elementId: prop.id,
          order:
            prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });
    }

    // statement.actants
    for (const actant of this.data.actants) {
      temp.push({
        type: StatementEnums.ElementType.Actant,
        entityId: actant.entityId,
        elementId: actant.id,
        order: actant.statementOrder,
      });

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, (prop: IProp) => {
        temp.push({
          type: StatementEnums.ElementType.Prop,
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: actant.entityId,
          elementId: prop.id,
          order:
            prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        temp.push({
          type: StatementEnums.ElementType.Classification,
          entityId: classification.entityId,
          originId: actant.entityId,
          elementId: classification.id,
          order: classification.statementOrder,
        });
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        temp.push({
          type: StatementEnums.ElementType.Identification,
          entityId: identification.entityId,
          originId: actant.entityId,
          elementId: identification.id,
          order: identification.statementOrder,
        });
      }
    }

    return ResponseStatement.sortListOfStatementItems(temp);
  }

  /**
   * Sorts the list of sortable elements for elementsOrders field.
   * Empty (false) values would be pushed to the end of the list.
   * @param unsorted
   * @returns
   */
  public static sortListOfStatementItems(unsorted: OrderType[]): OrderType[] {
    return unsorted.sort((a, b) => {
      if (b.order === a.order && a.order === false) {
        return 0;
      }
      if (b.order === false) {
        return -Infinity;
      }
      if (a.order === false) {
        return Infinity;
      }
      return a.order - b.order;
    });
  }
}
