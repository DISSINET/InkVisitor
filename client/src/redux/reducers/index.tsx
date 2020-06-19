import { combineReducers } from "redux";

import statements from "./statementsReducer";
import statement from "./statementReducer";
import {
  expandTreeId,
  selectTreeId,
  territories,
} from "./territoryTreeReducer";

const rootReducer = combineReducers({
  statements,
  statement,
  territories,
  territoriesTreeProps: combineReducers({
    expandTreeId,
    selectTreeId,
  }),
});

export default rootReducer;
