import { Dispatch } from "redux";

import { getStatements } from "api/getStatements";
import {
  FETCH_STATEMENTS,
  StatementsAction,
  StatementAction,
  FETCH_STATEMENT,
} from "redux/types";
import { Statement } from "types";
import { getStatement } from "api/getStatement";

export const fetchStatements = () => (
  dispatch: Dispatch<StatementsAction>
): Promise<void> => {
  getStatements().then((data: Statement[]) =>
    dispatch({
      type: FETCH_STATEMENTS,
      payload: data,
    })
  );
  return Promise.resolve();
};

export const fetchStatement = (id: string) => (
  dispatch: Dispatch<StatementAction>
): Promise<void> => {
  getStatement(id).then((data: Statement) =>
    dispatch({
      type: FETCH_STATEMENT,
      payload: data,
    })
  );
  return Promise.resolve();
};
