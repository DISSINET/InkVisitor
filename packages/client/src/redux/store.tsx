import { Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/treeInitializeSlice";
import selectedTerritoryPathSlice from "./features/selectedTerritoryPathSlice";
import territoryTreeBoxExpandedSlice from "./features/territoryTreeBoxExpandedSlice";
import lastBoxExpandedSlice from "./features/lastBoxExpandedSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    treeInitialized: treeInitializeSlice,
    selectedTerritoryPath: selectedTerritoryPathSlice,
    territoryTreeBoxExpanded: territoryTreeBoxExpandedSlice,
    lastBoxExpanded: lastBoxExpandedSlice,
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
