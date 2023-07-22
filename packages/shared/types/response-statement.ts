/**
 * type of the GET /statement {id} and POST /statement {id[]} response
 */

import { IEntity, IStatement, IWarning } from ".";
import { StatementEnums, UserEnums, WarningTypeEnums } from "../enums";

export interface EntityOrder {
  type: StatementEnums.ElementType.Actant | StatementEnums.ElementType.Action;
  entityId: string; // actant.entityId | action.actionId
  elementId: string; // action.id|actant.id
}

export interface PropOrder {
  type: StatementEnums.ElementType.Prop;
  propValueId: string;
  propTypeId: string;
  originId: string; // action.actionId|actant.entityId
  elementId: string; // prop.id
}

export interface ClassificationOrder {
  type: StatementEnums.ElementType.Classification;
  entityId: string; // actant.classification.entityId
  originId: string; // actant.entityId
  elementId: string; // classification.id
}

export interface IdentificationOrder {
  type: StatementEnums.ElementType.Identification;
  entityId: string; // actant.identification.entityId
  originId: string; // actant.entityId
  elementId: string; // identification.id
}

export type OrderType = (
  | EntityOrder
  | PropOrder
  | ClassificationOrder
  | IdentificationOrder
) & {
  order: number | false;
  type: StatementEnums.ElementType;
};

export interface IResponseStatement extends IStatement {
  entities: { [key: string]: IEntity }; // all entities (IEntity) used in actions/actants, actions/actants.props.type/value, territory, references, tags, actant identifications and classifications
  elementsOrders: OrderType[];
  // usedIn?: IStatement[];
  warnings: IWarning[];
  right?: UserEnums.RoleMode;
}
