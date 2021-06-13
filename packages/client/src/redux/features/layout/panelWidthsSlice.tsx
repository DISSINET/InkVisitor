import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { panelWidths } from "Theme/constants";

const initialState: number[] = panelWidths;

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
