/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IEntity, IStatement } from ".";
import { UserEnums } from "../enums";

export interface EntityOrder {
  entityId: string; // actant.entityId
  linkId: string; // actant.id
}

export interface PropOrder {
  propValueId: string;
  propTypeId: string;
  originId: string; // action|actant.entityId
  linkId: string; // action|actant.id
}

export interface ClassificationOrder {
  entityId: string; // actant.classification.entityId
  originId: string; // actant.entityId
  linkId: string; // actant.id
}

export interface IdentificationOrder {
  entityId: string; // actant.identification.entityId
  originId: string; // actant.entityId
  linkId: string; // actant.id
}

export type OrderType = EntityOrder | PropOrder | ClassificationOrder | IdentificationOrder;

export interface IResponseStatement extends IStatement {
  entities: { [key: string]: IEntity; }; // all entities (IEntity) used in actions/actants, actions/actants.props.type/value, territory, references, tags, actant identifications and classifications
  statementOrders: OrderType[];
  // usedIn?: IStatement[];
  right?: UserEnums.RoleMode;
}