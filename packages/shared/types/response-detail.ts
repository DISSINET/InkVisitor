/**
 * Very extensive object showing all the details about one actant
 */

import { IActant, IResponseActant, IResponseStatement, IStatement } from ".";

export interface IResponseDetail extends IResponseActant {
  entities: { [key: string]: IActant }; // all entities (IActant) from props.type/value and from all statements from usedInStatement, and usedInStatementProps
  usedInStatementAction: { statement: IResponseStatement; position: "action" }; // find all statements, where the actant is used as action, actant, or tag
  usedInStatementActant: {
    statement: IResponseStatement;
    position: "subject" | "actant1" | "actant2" | "pseudoactant";
  }[]; // find all statements, where the actant is used as action, actant, or tag
  usedInStatementProps: {
    statement: IResponseStatement;
    position: "value" | "type";
  }[]; // find all statements, where the actant is used anywhere in any statement prop
}
