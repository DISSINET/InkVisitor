import { applyMiddleware, createStore, compose, CombinedState } from "redux";
import thunk from "redux-thunk";

import rootReducer from "./reducers";
import { Store } from "redux";
import { Statement } from "types";
import { StatementsAction, StatementAction } from "./types";

const initialState = {};

const middleWare = [thunk];

const store: Store<
  CombinedState<{ statements: Statement[]; statement: Statement }>,
  StatementsAction | StatementAction
> = createStore(
  rootReducer,
  initialState,
  compose(applyMiddleware(...middleWare))
);

export default store;
