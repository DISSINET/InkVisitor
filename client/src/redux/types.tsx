import { Statement, Statements } from "types";

export const FETCH_STATEMENTS = "FETCH_STATEMENTS";
export const FETCH_STATEMENT = "FETCH_STATEMENT";

export interface StatementAction {
  type: typeof FETCH_STATEMENT;
  payload: Statement;
}

export interface StatementsAction {
  type: typeof FETCH_STATEMENTS;
  payload: Statements;
}
