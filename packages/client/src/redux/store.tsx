import { applyMiddleware, createStore, compose, CombinedState } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import rootReducer from "./reducers";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { ResponseMetaI } from "@shared/types/response-meta";
import {
  MetaAction,
  TerritoryAction,
  ActiveStatementIdAction,
  AuthTokenAction,
} from "./types";

const initialState = {};

const middleWare = [thunk];

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
const store: Store<
  CombinedState<{
    meta: ResponseMetaI;
    territory: ResponseTerritoryI;
    activeStatementId: string;
    token: string;
  }>,
  MetaAction | TerritoryAction | ActiveStatementIdAction | AuthTokenAction
> = configureStore({
  reducer: rootReducer,
  // initialState,
  // composeWithDevTools(applyMiddleware(...middleWare))
});

export default store;
