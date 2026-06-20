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

export function getInitPercentPanelWidths(layoutWidth: number): number[] {
  return layoutWidth > LARGE_SCREEN_LIMIT
    ? INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN
    : layoutWidth < EXTRA_SMALL_SCREEN_LIMIT
      ? INIT_PERCENT_PANEL_WIDTHS_EXTRA_SMALL_SCREEN
      : layoutWidth < SMALL_SCREEN_LIMIT
        ? INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN
        : INIT_PERCENT_PANEL_WIDTHS;
}

export function panelWidthsFromSeparators(
  treeSepPercent: number,
  centerSepPercent: number,
  searchSepPercent: number,
  layoutWidth: number,
): number[] {
  const onePercent = layoutWidth / 100;
  return [
    treeSepPercent * onePercent,
    (centerSepPercent - treeSepPercent) * onePercent,
    (searchSepPercent - centerSepPercent) * onePercent,
    layoutWidth - searchSepPercent * onePercent,
  ];
}

export function arePanelWidthsUndersized(
  widths: number[],
  expanded: boolean[] = [true, true, true, true],
): boolean {
  return (
    (expanded[0] && widths[0] < FIRST_PANEL_MIN_WIDTH) ||
    (expanded[1] && widths[1] < SECOND_PANEL_MIN_WIDTH) ||
    (expanded[2] && widths[2] < THIRD_PANEL_MIN_WIDTH) ||
    (expanded[3] && widths[3] < FOURTH_PANEL_MIN_WIDTH)
  );
}
