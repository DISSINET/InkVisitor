import { Store } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import authTokenSlice from "./features/authTokenSlice";
import usernameSlice from "./features/usernameSlice";
import treeInitializeSlice from "./features/treeInitializeSlice";

const store: Store = configureStore({
  reducer: {
    username: usernameSlice,
    token: authTokenSlice,
    treeInitialized: treeInitializeSlice,
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
