import { FETCH_STATEMENTS, StatementsAction } from "redux/types";
import { Statements } from "types";

const persons = (
  state: Statements = [],
  action: StatementsAction
): Statements => {
  switch (action.type) {
    case FETCH_STATEMENTS:
      return action.payload;
    default:
      return state;
  }
};

export default statements;
