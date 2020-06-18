import { Dispatch } from "redux";

import { getStatements } from "api/getStatements";
import { FETCH_STATEMENTS, StatementsAction } from "redux/types";
import { Statement } from "types";

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
