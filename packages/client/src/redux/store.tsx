import { Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/treeInitializeSlice";
import selectedTerritoryPathSlice from "./features/selectedTerritoryPathSlice";
import firstPanelExpandedSlice from "./features/firstPanelExpandedSlice";
import fourthPanelExpandedSlice from "./features/fourthPanelExpandedSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    treeInitialized: treeInitializeSlice,
    selectedTerritoryPath: selectedTerritoryPathSlice,
    firstPanelExpanded: firstPanelExpandedSlice,
    fourthPanelExpanded: fourthPanelExpandedSlice,
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
