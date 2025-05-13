import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: number[] = [0, 0, 0, 0];

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
