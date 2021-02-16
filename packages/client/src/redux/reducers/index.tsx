import { combineReducers } from "redux";

import meta from "./metaReducer";
import { territory } from "./territoryTreeReducer";
import token from "./authTokenReducer";
import activeStatementIdSlice from "redux/features/statementIdSlice";
import metaSlice from "redux/features/metaSlice";
import authTokenSlice from "redux/features/authTokenSlice";

const rootReducer = combineReducers({
  meta,
  territory,
  activeStatementId: activeStatementIdSlice,
  token,
});

export default rootReducer;
