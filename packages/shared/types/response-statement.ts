/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IEntity, IStatement } from ".";
import { UserEnums } from "../enums";

export interface EntityOrder {
  entityId: string;
}

export interface PropOrder {
  propValueId: string;
  propTypeId: string;
  originId: string;
}

export type OrderType = EntityOrder | PropOrder;
export type Order<T extends OrderType> = T & {
  linkId: string;
};

export interface IResponseStatement extends IStatement {
  entities: { [key: string]: IEntity; }; // all entities (IEntity) used in actions/actants, actions/actants.props.type/value, territory, references, tags, actant identifications and classifications
  statementOrders: Order<OrderType>[];
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
}