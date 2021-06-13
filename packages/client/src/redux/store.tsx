import { combineReducers, Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/territoryTree/treeInitializeSlice";
import selectedTerritoryPathSlice from "./features/territoryTree/selectedTerritoryPathSlice";
import firstPanelExpandedSlice from "./features/layout/firstPanelExpandedSlice";
import fourthPanelExpandedSlice from "./features/layout/fourthPanelExpandedSlice";
import layoutWidthSlice from "./features/layout/layoutWidthSlice";
import panelWidthsSlice from "./features/layout/panelWidthsSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    territoryTree: combineReducers({
      selectedTerritoryPath: selectedTerritoryPathSlice,
      treeInitialized: treeInitializeSlice,
    }),
    layout: combineReducers({
      layoutWidth: layoutWidthSlice,
      panelWidths: panelWidthsSlice,
      firstPanelExpanded: firstPanelExpandedSlice,
      fourthPanelExpanded: fourthPanelExpandedSlice,
    }),
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
