import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const contentHeightSlice = createSlice({
  name: "contentHeight",
  initialState: initialState,
  reducers: {
    setContentHeight: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setContentHeight } = contentHeightSlice.actions;

export default contentHeightSlice.reducer;
