/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant, IStatement } from ".";
import { Position, PositionContext } from "../enums";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IActant }; // all entities from IStatement and entityIds...
  usedInStatement: IResponseUsedInStatement<Position | "action">[]; // all statements, where the detail id is used as an actant, action, or tag
  usedInStatementProps: IResponseUsedInStatement<PositionContext>[]; // all statements, where the detail id is used in props
  usedInMetaProps: IResponseUsedInMetaProp<PositionContext>[]; // all entities, where the detail id is used in props
}

export interface IResponseUsedInStatement<PositionEnum> {
  statement: IStatement;
  position: PositionEnum;
  originId?: string; // what entity is the detail id used for
}

export interface IResponseUsedInMetaProp<PositionEnum> {
  entityId: string; // IActant(later IEntity) will be placed in IResponseDetail.entities
  position: PositionEnum; // type | value
}
