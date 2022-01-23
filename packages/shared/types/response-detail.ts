/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant, IStatement } from ".";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IActant }; // all entities (IActant) from props.type/value and from all statements from usedInStatement, and usedInStatementProps
  usedInStatement: string[]; // find all statements, where the actant is used as action, actant, or tag
  usedInStatementProps: string[]; // find all statements, where the actant is used anywhere in any statement prop
}
