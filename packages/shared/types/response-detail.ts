/**
 * Very extensive object showing all the details about one actant
 */

import { IEntity, IResponseActant, IStatement } from ".";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IEntity }; // all entities (IEntity) from props.type/value and from all statements from usedInStatement, and usedInStatementProps
  usedInStatement?: IStatement[]; // find all statements, where the actant is used as action, actant, or tag
  usedInStatementProps?: IStatement[]; // find all statements, where the actant is used anywhere in any statement prop
}
