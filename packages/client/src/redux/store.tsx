import {
  applyMiddleware,
  createStore,
  compose,
  CombinedState,
  AnyAction,
} from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { Store } from "redux";

import rootReducer from "./reducers";
import { TerritoriesTreeProps, Node } from "types";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { ResponseMetaI } from "@shared/types/response-meta";
import {
  MetaAction,
  TerritoryAction,
  ExpandTreeAction,
  SelectTreeAction,
} from "./types";

const initialState = {};

const middleWare = [thunk];

const store: Store<
  CombinedState<{
    meta: ResponseMetaI;
    territory: ResponseTerritoryI;
    territoriesTreeProps: TerritoriesTreeProps;
  }>,
  MetaAction | TerritoryAction | ExpandTreeAction | SelectTreeAction | AnyAction
> = createStore(
  rootReducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleWare))
);

export default store;
