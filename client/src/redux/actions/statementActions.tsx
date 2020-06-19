import { Dispatch } from "redux";

import { getStatement } from "api/getStatement";
import { FETCH_STATEMENT, StatementAction } from "redux/types";
import { Statement } from "types";

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
