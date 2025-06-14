import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number = 0;

const secondPanelRealWidthSlice = createSlice({
  name: "secondPanelRealWidth",
  initialState: initialState,
  reducers: {
    setSecondPanelRealWidth: (state: number, action: PayloadAction<number>) =>
      (state = action.payload),
  },
});

export const { setSecondPanelRealWidth } = secondPanelRealWidthSlice.actions;

export default secondPanelRealWidthSlice.reducer;
