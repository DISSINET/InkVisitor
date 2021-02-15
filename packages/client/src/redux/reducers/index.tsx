import { combineReducers } from "redux";

import meta from "./metaReducer";
import { territory } from "./territoryTreeReducer";
// import activeStatementId from "./statementReducer";
import token from "./authTokenReducer";
import activeStatementIdSlice from "redux/features/statementIdSlice";

const rootReducer = combineReducers({
  meta,
  territory,
  activeStatementId: activeStatementIdSlice,
  token,
});

export default rootReducer;
