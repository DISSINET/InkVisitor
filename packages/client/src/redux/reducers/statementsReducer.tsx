import { FETCH_STATEMENTS, StatementsAction } from "redux/types";
import { Statement } from "types";

const statements = (
  state: Statement[] = [],
  action: StatementsAction
): Statement[] => {
  switch (action.type) {
    case FETCH_STATEMENTS:
      return action.payload;
    default:
      return state;
  }
};

export default statements;
