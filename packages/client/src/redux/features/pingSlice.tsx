import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = -1;

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
