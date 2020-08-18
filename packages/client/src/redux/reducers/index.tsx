import { combineReducers } from "redux";

import statements from "./statementsReducer";
import statement from "./statementReducer";
import {
  expandedTreeId,
  selectedTreeId,
  territories,
} from "./territoryTreeReducer";

const rootReducer = combineReducers({
  statements,
  statement,
  territories,
  territoriesTreeProps: combineReducers({
    expandedTreeId,
    selectedTreeId,
  }),
});

export default rootReducer;
