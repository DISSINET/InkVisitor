import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number[] = [];

const panelWidthsPercentSlice = createSlice({
  name: "panelWidthsPercent",
  initialState: initialState,
  reducers: {
    setPanelWidthsPercent: (state: number[], action: PayloadAction<number[]>) =>
      (state = action.payload),
  },
});

export const { setPanelWidthsPercent } = panelWidthsPercentSlice.actions;

export default panelWidthsPercentSlice.reducer;
