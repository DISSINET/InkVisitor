import { combineReducers } from "redux";

import statements from "./statementsReducer";
import statement from "./statementReducer";

const rootReducer = combineReducers({
  statements,
  statement,
});

export default rootReducer;
