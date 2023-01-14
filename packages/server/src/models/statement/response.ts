import { UserEnums } from "@shared/enums";
import { IEntity, IProp, IResponseStatement, IStatement } from "@shared/types";
import { EntityOrder, OrderType, PropOrder } from "@shared/types/response-statement";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";
import Entity from "../entity/entity";

export type OrderTypeWithIndex = OrderType & { order: number | false; };

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
    let temp: OrderTypeWithIndex[] = [];

    // statement.props
    Entity.extractIdsFromProps(this.props, (prop: IProp) => {
      temp.push({
        propValueId: prop.value.entityId,
        propTypeId: prop.type.entityId,
        originId: this.id,
        elementId: prop.id,
        order: prop.statementOrder
      } as PropOrder & { order: number | false; });
    });

    // statement.actions
    for (const action of this.data.actions) {
      temp.push({
        entityId: action.actionId,
        elementId: action.id,
        order: action.statementOrder
      } as EntityOrder & { order: number | false; });

      // statement.actions.props
      Entity.extractIdsFromProps(action.props, (prop: IProp) => {
        temp.push({
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: action.actionId,
          elementId: action.id,
          order: prop.statementOrder
        } as PropOrder & { order: number | false; });
      });
    }

    // statement.actants
    for (const actant of this.data.actants) {
      temp.push({
        entityId: actant.entityId,
        elementId: actant.id,
        order: actant.statementOrder
      } as EntityOrder & { order: number | false; });

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, (prop: IProp) => {
        temp.push({
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: actant.entityId,
          elementId: actant.id,
          order: prop.statementOrder
        } as PropOrder & { order: number | false; });
      });

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        temp.push({
          entityId: classification.entityId,
          originId: actant.entityId,
          elementId: classification.id,
          order: classification.statementOrder
        } as EntityOrder & { order: number | false; });
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        temp.push({
          entityId: identification.entityId,
          elementId: actant.entityId,
          originId: identification.id,
          order: identification.statementOrder
        } as EntityOrder & { order: number | false; });
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
  public static sortListOfStatementItems(unsorted: OrderTypeWithIndex[]): OrderType[] {
    return unsorted.sort((a, b) => {
      if (b.order === a.order && a.order === false) { return 0; };
      if (b.order === false) { return -Infinity; };
      if (a.order === false) { return Infinity; };
      return a.order - b.order;
    }).map<OrderType>((a: OrderTypeWithIndex) => {
      const { order, ...orderObject } = a;
      return orderObject;
    });
  }
}