import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: boolean = true;

const lastBoxExpandedSlice = createSlice({
  name: "lastBoxExpanded",
  initialState: initialState,
  reducers: {
    setLastBoxExpanded: (state: boolean, action: PayloadAction<boolean>) =>
      (state = action.payload),
  },
});

export const { setLastBoxExpanded } = lastBoxExpandedSlice.actions;

export default lastBoxExpandedSlice.reducer;
