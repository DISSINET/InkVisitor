import { Dispatch } from "redux";

import { ActiveStatementIdAction, SET_ACTIVE_STATEMENT_ID } from "redux/types";

export const setActiveStatementId = (id: string) => (
  dispatch: Dispatch<ActiveStatementIdAction>
): Promise<void> => {
  dispatch({
    type: SET_ACTIVE_STATEMENT_ID,
    activeStatementId: id,
  });
  return Promise.resolve();
};
