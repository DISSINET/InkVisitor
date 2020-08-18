import {
  applyMiddleware,
  createStore,
  compose,
  CombinedState,
  AnyAction,
} from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

import rootReducer from "./reducers";
import { Store } from "redux";
import { Statement, TerritoriesTreeProps, Node } from "types";
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
    territoriesTreeProps: TerritoriesTreeProps;
    territories: Node;
  }>,
  | StatementsAction
  | StatementAction
  | ExpandTreeAction
  | SelectTreeAction
  | FetchTerritoriesAction
  | AnyAction
> = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleWare))
);

export default store;
