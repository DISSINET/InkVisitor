import { combineReducers } from "redux";

import meta from "./metaReducer";
import { territory } from "./territoryTreeReducer";
import activeStatementId from "./statementReducer";
import token from "./authTokenReducer";

const rootReducer = combineReducers({
  meta,
  territory,
  activeStatementId,
  token,
});

export default rootReducer;
