import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  arePanelWidthsUndersized,
  getInitPercentPanelWidths,
  panelWidthsFromSeparators,
} from "utils/layoutUtils";
import { floorNumberToOneDecimal } from "utils/utils";
import { RootState } from "redux/store";

export const selectPanelWidth = (panelIndex: number) =>
  createSelector(
    (state: RootState) => state.layout.mainPage.panelWidths,
    (panelWidths) => panelWidths[panelIndex]
  );

function computeInitialPanelWidths(): number[] {
  if (typeof window === "undefined") return [0, 0, 0, 0];

  const layoutWidth = window.innerWidth;
  if (layoutWidth <= 0) return [0, 0, 0, 0];

  const treeSep = localStorage.getItem("mainPageTreeSeparatorXPosition");
  const centerSep = localStorage.getItem("mainPageCenterSeparatorXPosition");
  const searchSep = localStorage.getItem("mainPageSearchSeparatorXPosition");

  if (treeSep && centerSep && searchSep) {
    const widths = panelWidthsFromSeparators(
      Number(treeSep), Number(centerSep), Number(searchSep), layoutWidth,
    );
    const expanded = [
      localStorage.getItem("firstPanelExpanded") !== "false",
      localStorage.getItem("secondPanelExpanded") !== "false",
      localStorage.getItem("thirdPanelExpanded") !== "false",
      localStorage.getItem("fourthPanelExpanded") !== "false",
    ];
    if (!arePanelWidthsUndersized(widths, expanded, layoutWidth)) {
      return widths.map(floorNumberToOneDecimal);
    }
  }

  const onePercent = layoutWidth / 100;
  return getInitPercentPanelWidths(layoutWidth).map(
    (p) => floorNumberToOneDecimal(p * onePercent),
  );
}

const initialState: number[] = computeInitialPanelWidths();

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
