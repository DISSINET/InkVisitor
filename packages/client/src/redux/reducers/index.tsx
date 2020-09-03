import { combineReducers } from "redux";

import meta from "./metaReducer";
import {
  expandedTreeId,
  selectedTreeId,
  territory,
} from "./territoryTreeReducer";

const rootReducer = combineReducers({
  meta,
  territory,
  territoriesTreeProps: combineReducers({
    expandedTreeId,
    selectedTreeId,
  }),
});

export default rootReducer;
