import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initPanelWidths } from "Theme/constants";

const initialState: number[] = initPanelWidths;

const panelWidthsSlice = createSlice({
  name: "panelWidths",
  initialState: initialState,
  reducers: {
    setPanelWidths: (state: number[], action: PayloadAction<number[]>) =>
      (state = action.payload),
  },
});

export const { setPanelWidths } = panelWidthsSlice.actions;

export default panelWidthsSlice.reducer;
