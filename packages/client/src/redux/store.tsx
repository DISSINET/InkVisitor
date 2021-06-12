import { combineReducers, Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/treeInitializeSlice";
import selectedTerritoryPathSlice from "./features/selectedTerritoryPathSlice";
import firstPanelExpandedSlice from "./features/firstPanelExpandedSlice";
import fourthPanelExpandedSlice from "./features/fourthPanelExpandedSlice";
import layoutWidthSlice from "./features/layoutWidthSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    territoryTree: combineReducers({
      selectedTerritoryPath: selectedTerritoryPathSlice,
      treeInitialized: treeInitializeSlice,
    }),
    layout: combineReducers({
      layoutWidth: layoutWidthSlice,
      firstPanelExpanded: firstPanelExpandedSlice,
      fourthPanelExpanded: fourthPanelExpandedSlice,
    }),
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
