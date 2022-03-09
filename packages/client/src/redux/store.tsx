import { combineReducers, Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/territoryTree/treeInitializeSlice";
import selectedTerritoryPathSlice from "./features/territoryTree/selectedTerritoryPathSlice";
import firstPanelExpandedSlice from "./features/layout/firstPanelExpandedSlice";
import fourthPanelExpandedSlice from "./features/layout/fourthPanelExpandedSlice";
import layoutWidthSlice from "./features/layout/layoutWidthSlice";
import panelWidthsSlice from "./features/layout/panelWidthsSlice";
import separatorXPositionSlice from "./features/layout/separatorXPositionSlice";
import draggedTerritorySlice from "./features/territoryTree/draggedTerritorySlice";
import draggedPropRowSlice from "./features/rowDnd/draggedPropRowSlice";
import draggedActantRowSlice from "./features/rowDnd/draggedActantRowSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    territoryTree: combineReducers({
      selectedTerritoryPath: selectedTerritoryPathSlice,
      treeInitialized: treeInitializeSlice,
      draggedTerritory: draggedTerritorySlice,
    }),
    rowDnd: combineReducers({
      draggedPropRow: draggedPropRowSlice,
      draggedActantRow: draggedActantRowSlice,
    }),
    layout: combineReducers({
      layoutWidth: layoutWidthSlice,
      panelWidths: panelWidthsSlice,
      separatorXPosition: separatorXPositionSlice,
      firstPanelExpanded: firstPanelExpandedSlice,
      fourthPanelExpanded: fourthPanelExpandedSlice,
    }),
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
