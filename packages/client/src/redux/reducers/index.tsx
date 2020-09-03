import { combineReducers } from "redux";

import meta from "./metaReducer";
import { territory } from "./territoryTreeReducer";
import activeStatementId from "./statementReducer";

const rootReducer = combineReducers({
  meta,
  territory,
  activeStatementId,
});

export default rootReducer;
