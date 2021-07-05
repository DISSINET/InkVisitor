import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const separatorXPositionSlice = createSlice({
  name: "separatorXPosition",
  initialState: initialState,
  reducers: {
    setSeparatorXPosition: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setSeparatorXPosition } = separatorXPositionSlice.actions;

export default separatorXPositionSlice.reducer;
