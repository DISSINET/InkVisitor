import { Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import rootReducer from "./reducers";

// const middleWare = [thunk];

// const store: Store<
//   CombinedState<{
//     meta: ResponseMetaI;
//     territory: ResponseTerritoryI;
//     activeStatementId: string;
//     token: string;
//   }>,
//   MetaAction | TerritoryAction | ActiveStatementIdAction | AuthTokenAction
// > = createStore(
//   rootReducer,
//   initialState,
//   composeWithDevTools(applyMiddleware(...middleWare))
// );
const store: Store = configureStore({
  reducer: rootReducer,
});

export default store;
