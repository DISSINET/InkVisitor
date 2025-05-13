import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { INIT_PERCENT_PANEL_WIDTHS } from "Theme/constants";

const initialState: number[] = INIT_PERCENT_PANEL_WIDTHS;

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
