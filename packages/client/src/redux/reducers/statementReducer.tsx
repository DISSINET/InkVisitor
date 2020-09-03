import { ActiveStatementIdAction, SET_ACTIVE_STATEMENT_ID } from "redux/types";

const activeStatementId = (
  state: string = "",
  action: ActiveStatementIdAction
): string => {
  switch (action.type) {
    case SET_ACTIVE_STATEMENT_ID:
      return action.activeStatementId;
    default:
      return state;
  }
};

export default activeStatementId;
