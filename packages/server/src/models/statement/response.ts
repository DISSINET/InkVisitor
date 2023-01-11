import { UserEnums } from "@shared/enums";
import { IEntity, IProp, IResponseStatement, IStatement } from "@shared/types";
import { EntityOrder, OrderType, PropOrder } from "@shared/types/response-statement";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";
import Entity from "../entity/entity";

type OrderTypeWithIndex = OrderType & { order: number | false; };

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity; };
  statementOrders: OrderType[];
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
    this.statementOrders = [];
  }

  async prepare(req: IRequest) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    const entities = await this.getEntities(req.db.connection as Connection);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
    this.statementOrders = this.prepareStatementOrders();
  }

  /**
   * fills values for statementOrders array + sort them afterwards
   */
  prepareStatementOrders(): OrderType[] {
    /// unsorted items here
    let temp: OrderTypeWithIndex[] = [];

    // statement.props
    Entity.extractIdsFromProps(this.props, (prop: IProp) => {
      temp.push({
        propValueId: prop.value.entityId,
        propTypeId: prop.type.entityId,
        originId: this.id,
        linkId: prop.id,
        order: prop.statementOrder
      } as PropOrder & { order: number | false; });
    });

    // statement.actions
    for (const action of this.data.actions) {
      temp.push({
        entityId: action.actionId,
        linkId: action.id,
        order: action.statementOrder
      } as EntityOrder & { order: number | false; });

      // statement.actions.props
      Entity.extractIdsFromProps(action.props, (prop: IProp) => {
        temp.push({
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: action.actionId,
          linkId: action.id,
          order: prop.statementOrder
        } as PropOrder & { order: number | false; });
      });
    }

    // statement.actants
    for (const actant of this.data.actants) {
      temp.push({
        entityId: actant.entityId,
        linkId: actant.id,
        order: actant.statementOrder
      } as EntityOrder & { order: number | false; });

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, (prop: IProp) => {
        temp.push({
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: actant.entityId,
          linkId: actant.id,
          order: prop.statementOrder
        } as PropOrder & { order: number | false; });
      });

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        temp.push({
          entityId: classification.entityId,
          linkId: actant.entityId,
          order: classification.statementOrder
        } as EntityOrder & { order: number | false; });
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        temp.push({
          entityId: identification.entityId,
          linkId: actant.entityId,
          order: identification.statementOrder
        } as EntityOrder & { order: number | false; });
      }
    }

    console.log(JSON.stringify(temp, null, 4));
    return temp.sort((a, b) => {
      if (b.order === false) { return -Infinity; };
      if (a.order === false) { return Infinity; };
      return a.order - b.order;
    }).map<OrderType>((a: OrderTypeWithIndex) => {
      const { order, ...orderObject } = a;
      return orderObject;
    });
  }
}
