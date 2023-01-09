import { UserEnums } from "@shared/enums";
import { IEntity, IResponseStatement, IStatement } from "@shared/types";
import { Order, OrderType } from "@shared/types/response-statement";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Statement from "./statement";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity; };
  statementOrders: Order<OrderType>[];
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
  }
}
