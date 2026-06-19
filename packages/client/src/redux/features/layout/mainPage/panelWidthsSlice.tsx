import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  EXTRA_SMALL_SCREEN_LIMIT,
  FIRST_PANEL_MIN_WIDTH,
  FOURTH_PANEL_MIN_WIDTH,
  INIT_PERCENT_PANEL_WIDTHS,
  INIT_PERCENT_PANEL_WIDTHS_EXTRA_SMALL_SCREEN,
  INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN,
  INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN,
  LARGE_SCREEN_LIMIT,
  SECOND_PANEL_MIN_WIDTH,
  SMALL_SCREEN_LIMIT,
  THIRD_PANEL_MIN_WIDTH,
} from "Theme/constants";
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

  const onePercent = layoutWidth / 100;

  const treeSep = localStorage.getItem("mainPageTreeSeparatorXPosition");
  const centerSep = localStorage.getItem("mainPageCenterSeparatorXPosition");
  const searchSep = localStorage.getItem("mainPageSearchSeparatorXPosition");

  if (treeSep && centerSep && searchSep) {
    const first = Number(treeSep) * onePercent;
    const second = (Number(centerSep) - Number(treeSep)) * onePercent;
    const third = (Number(searchSep) - Number(centerSep)) * onePercent;
    const fourth = layoutWidth - Number(searchSep) * onePercent;

    const isSomethingUndersized =
      first < FIRST_PANEL_MIN_WIDTH ||
      second < SECOND_PANEL_MIN_WIDTH ||
      third < THIRD_PANEL_MIN_WIDTH ||
      fourth < FOURTH_PANEL_MIN_WIDTH;

    if (!isSomethingUndersized) {
      return [first, second, third, fourth].map((w) => Math.floor(w * 10) / 10);
    }
  }

  const initPercent =
    layoutWidth > LARGE_SCREEN_LIMIT
      ? INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN
      : layoutWidth < EXTRA_SMALL_SCREEN_LIMIT
        ? INIT_PERCENT_PANEL_WIDTHS_EXTRA_SMALL_SCREEN
        : layoutWidth < SMALL_SCREEN_LIMIT
          ? INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN
          : INIT_PERCENT_PANEL_WIDTHS;

  return initPercent.map((p) => Math.floor(p * onePercent * 10) / 10);
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
