import { combineReducers } from "redux";

import token from "./authTokenReducer";
import authTokenSlice from "redux/features/authTokenSlice";

const rootReducer = combineReducers({
  token,
});

export default rootReducer;
