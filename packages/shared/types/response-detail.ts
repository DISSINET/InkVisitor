/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant, IStatement } from ".";
import { Position, PositionContext } from "../enums";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IActant }; // all entities (IActant) from props.type/value and from all statements from usedInStatement, and usedInStatementProps
  usedInStatementEntities: IResponseUsedStatement<Position | "action">[]; // find all statements, where the actant is used as action, actant, or tag
  usedInStatementProps: IResponseUsedStatement<PositionContext>[]; // find all statements, where the actant is used anywhere in any statement propp
  usedInMetaProps: string[];
}

export interface IResponseUsedStatement<PositionEnum> {
  statement: IStatement;
  position: PositionEnum;
}
