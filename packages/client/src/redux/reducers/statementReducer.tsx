import { FETCH_STATEMENT, StatementAction } from "redux/types";
import { Statement } from "types";

const initialState: Statement = {
  id: "",
  tree: {},
};

const statement = (
  state: Statement = initialState,
  action: StatementAction
): Statement => {
  switch (action.type) {
    case FETCH_STATEMENT:
      return action.payload;
    default:
      return state;
  }
};

export default statement;
