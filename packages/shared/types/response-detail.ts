/**
 * Very extensive object showing all the details about one actant
 */

import { IEntity, IResponseEntity, IStatement } from ".";
import { UsedInPosition } from "../enums";

export interface IResponseDetail extends IResponseEntity {
  entities: { [key: string]: IEntity }; // all entities from IStatement and entityIds...
  usedInStatement: IResponseUsedInStatement<UsedInPosition>[]; // all statements, where the detail id is used as an actant, action, or tag
  usedInStatementProps: IResponseUsedInStatementProps[]; // all statements, where the detail id is used in props
  usedInMetaProps: IResponseUsedInMetaProp<UsedInPosition>[]; // all entities, where the detail id is used in props (entity.props[])
  usedAsTemplate?: string[];
}

export interface IResponseUsedInStatement<PositionEnum> {
  statement: IStatement;
  position: PositionEnum;
}

export interface IResponseUsedInStatementProps {
  statementId: string;
  typeId: string;
  valueId: string;
  originId: string; // what entity is the detail id used for
}
// TODO: clear position
export interface IResponseUsedInMetaProp<PositionEnum> {
  typeId: string;
  valueId: string;
  originId: string; // what entity is the detail id used for
}
