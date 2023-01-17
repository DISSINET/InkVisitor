import { StatementEnums, UserEnums } from "@shared/enums";
import { IEntity, IProp, IResponseStatement, IStatement } from "@shared/types";
import { EntityOrder, OrderType, PropOrder } from "@shared/types/response-statement";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";
import Entity from "../entity/entity";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity; };
  elementsOrders: OrderType[];
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
    this.elementsOrders = [];
  }

  async prepare(req: IRequest) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
    this.elementsOrders = this.prepareElementsOrders();
  }

  /**
   * fills values for elementsOrders array + sort them afterwards
   */
  prepareElementsOrders(): OrderType[] {
    /// unsorted items here
    let temp: OrderType[] = [];

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
          order: prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });
    }

    // statement.actants
    for (const actant of this.data.actants) {
      temp.push({
        type: StatementEnums.ElementType.Actant,
        entityId: actant.entityId,
        elementId: actant.id,
        order: actant.statementOrder
      });

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, (prop: IProp) => {
        temp.push({
          type: StatementEnums.ElementType.Prop,
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: actant.entityId,
          elementId: prop.id,
          order: prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        temp.push({
          type: StatementEnums.ElementType.Classification,
          entityId: classification.entityId,
          originId: actant.entityId,
          elementId: classification.id,
          order: classification.statementOrder
        });
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        temp.push({
          type: StatementEnums.ElementType.Identification,
          entityId: identification.entityId,
          originId: actant.entityId,
          elementId: identification.id,
          order: identification.statementOrder
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
      if (b.order === a.order && a.order === false) { return 0; };
      if (b.order === false) { return -Infinity; };
      if (a.order === false) { return Infinity; };
      return a.order - b.order;
    });
  }
}