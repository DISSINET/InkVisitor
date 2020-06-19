import { applyMiddleware, createStore, compose, CombinedState } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

import rootReducer from "./reducers";
import { Store } from "redux";
import { Statement } from "types";
import {
  StatementsAction,
  StatementAction,
  ExpandTreeAction,
  SelectTreeAction,
  FetchTerritoriesAction,
} from "./types";

const initialState = {};

const middleWare = [thunk];

const store: Store<
  CombinedState<{
    statements: Statement[];
    statement: Statement;
    expandTreeId: string;
    selectTreeId: string;
  }>,
  | StatementsAction
  | StatementAction
  | ExpandTreeAction
  | SelectTreeAction
  | FetchTerritoriesAction
> = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleWare))
);

export default store;
