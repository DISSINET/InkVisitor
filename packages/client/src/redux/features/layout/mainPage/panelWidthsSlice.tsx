import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

// Selector for a specific panel width allows us to get the panel width in component without rerenders on different component changes
// Usage: const treeWidth = useSelector(selectPanelWidth(0));
export const selectPanelWidth = (panelIndex: number) =>
  createSelector(
    (state: RootState) => state.layout.mainPage.panelWidths,
    (panelWidths) => panelWidths[panelIndex]
  );

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
