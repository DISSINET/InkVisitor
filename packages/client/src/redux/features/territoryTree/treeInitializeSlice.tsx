import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = false;

const treeInitializeSlice = createSlice({
  name: "treeInitialized",
  initialState: initialState,
  reducers: {
    setTreeInitialized: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setTreeInitialized } = treeInitializeSlice.actions;

export default treeInitializeSlice.reducer;
