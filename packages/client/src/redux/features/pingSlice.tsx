import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { defaultPing } from "Theme/constants";

const initialState: number = defaultPing;

const pingSlice = createSlice({
  name: "ping",
  initialState: initialState,
  reducers: {
    setPing: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setPing } = pingSlice.actions;

export default pingSlice.reducer;
