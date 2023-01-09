import { UserEnums } from "@shared/enums";
import { IEntity, IProp, IResponseStatement, IStatement } from "@shared/types";
import { EntityOrder, OrderType, PropOrder } from "@shared/types/response-statement";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";
import Entity from "../entity/entity";

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
    this.prepareStatementOrders();
  }

  /**
   * fills values for statementOrders array + sort them afterwards
   */
  prepareStatementOrders() {
    type OrderTypeWithIndex = OrderType & { order: number | false; };
    let temp: OrderTypeWithIndex[] = [];
    Entity.extractIdsFromProps(this.props, (prop: IProp) => {
      temp.push({
        propValueId: prop.value.entityId,
        propTypeId: prop.type.entityId,
        originId: this.id,
        linkId: prop.id,
        order: prop.statementOrder
      } as PropOrder & { order: number | false; });
    });

    for (const action of this.data.actions) {
      temp.push({
        entityId: action.actionId,
        linkId: action.id,
        order: action.statementOrder
      } as EntityOrder & { order: number | false; });

      Entity.extractIdsFromProps(action.props, (prop: IProp) => {
        temp.push({
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: action.id,
          linkId: prop.id,
          order: prop.statementOrder
        } as PropOrder & { order: number | false; });
      });
    }

    for (const actant of this.data.actants) {
      temp.push({
        entityId: actant.entityId,
        linkId: actant.id,
        order: actant.statementOrder
      } as EntityOrder & { order: number | false; });

      for (const classification of actant.classifications) {
        temp.push({
          entityId: classification.entityId,
          linkId: classification.id,
          order: classification.statementOrder
        } as EntityOrder & { order: number | false; });
      }

      for (const identification of actant.identifications) {
        temp.push({
          entityId: identification.entityId,
          linkId: identification.id,
          order: identification.statementOrder
        } as EntityOrder & { order: number | false; });
      }
    }

    this.statementOrders = temp.sort((a, b) => {
      if (b.order === false) { return -Infinity; };
      if (a.order === false) { return Infinity; };
      return a.order - b.order;
    }).map<OrderType>((a: OrderTypeWithIndex) => {
      const { order, ...orderObject } = a;
      return orderObject;
    });
  }
}
