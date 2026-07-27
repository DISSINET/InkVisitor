import {
  COLLAPSED_PANEL_WIDTH,
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

// Translates the stored base (fully expanded) panel widths into the widths the
// panels actually render at, given which panels are collapsed. A collapsed
// panel shrinks to COLLAPSED_PANEL_WIDTH and hands its freed space to the
// neighbour that absorbs it. Mirrors the width memos in MainPage so the
// undersized check below reasons about what the user really sees - otherwise a
// collapsed neighbour (e.g. a collapsed fourth panel) leaves a stored width
// looking negative/undersized even though the visible layout is fine.
export function getEffectivePanelWidths(
  widths: number[],
  expanded: boolean[],
  layoutWidth: number,
): number[] {
  const [firstExpanded, secondExpanded, thirdExpanded, fourthExpanded] = expanded;

  const firstWidth = !firstExpanded
    ? COLLAPSED_PANEL_WIDTH
    : secondExpanded || thirdExpanded || fourthExpanded
      ? widths[0]
      : layoutWidth - 3 * COLLAPSED_PANEL_WIDTH;

  const secondBaseWidth = firstExpanded
    ? widths[1]
    : widths[1] + widths[0] - COLLAPSED_PANEL_WIDTH;

  const secondWidth = !secondExpanded
    ? COLLAPSED_PANEL_WIDTH
    : secondBaseWidth +
      (!thirdExpanded && !fourthExpanded
        ? widths[2] + widths[3] - 2 * COLLAPSED_PANEL_WIDTH
        : 0);

  let thirdWidth = !thirdExpanded
    ? COLLAPSED_PANEL_WIDTH
    : fourthExpanded
      ? widths[2]
      : widths[2] + widths[3] - COLLAPSED_PANEL_WIDTH;

  if (!secondExpanded && thirdExpanded) {
    thirdWidth += secondBaseWidth - COLLAPSED_PANEL_WIDTH;
  }

  const fourthWidth = !fourthExpanded
    ? COLLAPSED_PANEL_WIDTH
    : layoutWidth - firstWidth - secondWidth - thirdWidth;

  return [firstWidth, secondWidth, thirdWidth, fourthWidth];
}

// Panels are sized from CSS custom properties on the document root rather than
// from a React prop, so a separator drag can repaint the whole layout once per
// animation frame without rendering the panel contents.
export function panelWidthVar(panelIndex: number): string {
  return `--panel-w-${panelIndex}`;
}

export function writePanelWidthVars(widths: number[]): void {
  const root = document.documentElement;
  widths.forEach((width, index) => {
    // a non-finite length makes the whole width declaration invalid, which
    // drops the panel to its content size
    if (!Number.isFinite(width)) return;
    root.style.setProperty(panelWidthVar(index), `${width / 10}rem`);
  });
}

// The left edge of the panel at panelIndex, as a CSS length. Lets an element
// outside the panel flow follow a drag off the same variables the panels use.
export function panelLeftEdgeValue(panelIndex: number): string {
  if (panelIndex < 1) return "0";
  const widths = Array.from(
    { length: panelIndex },
    (_, index) => `var(${panelWidthVar(index)})`,
  );
  return `calc(${widths.join(" + ")})`;
}

// A separator is positioned from a shared variable rather than from its own
// props because a drag on one separator can push the others, and the pushed
// ones are not the component that knows about it.
export function separatorPositionVar(separatorKey: string): string {
  return `--sep-x-${separatorKey}`;
}

export function writeSeparatorPositionVars(
  positions: Record<string, number | undefined>,
): void {
  const root = document.documentElement;
  Object.entries(positions).forEach(([separatorKey, xPosition]) => {
    if (xPosition === undefined || !Number.isFinite(xPosition)) return;
    root.style.setProperty(
      separatorPositionVar(separatorKey),
      `${xPosition / 10}rem`,
    );
  });
}

// Boxes are sized the same way as panels, keyed by name rather than by index
// since a panel holds a different set of them depending on what is open.
export function boxHeightVar(boxKey: string): string {
  return `--box-h-${boxKey}`;
}

export function writeBoxHeightVars(heights: {
  [boxKey: string]: number | undefined;
}): void {
  const root = document.documentElement;
  Object.entries(heights).forEach(([boxKey, height]) => {
    if (height === undefined || !Number.isFinite(height)) return;
    root.style.setProperty(boxHeightVar(boxKey), `${height / 10}rem`);
  });
}

export function arePanelWidthsUndersized(
  widths: number[],
  expanded: boolean[] = [true, true, true, true],
  layoutWidth: number = widths.reduce((sum, width) => sum + width, 0),
): boolean {
  const effective = getEffectivePanelWidths(widths, expanded, layoutWidth);
  return (
    (expanded[0] && effective[0] < FIRST_PANEL_MIN_WIDTH) ||
    (expanded[1] && effective[1] < SECOND_PANEL_MIN_WIDTH) ||
    (expanded[2] && effective[2] < THIRD_PANEL_MIN_WIDTH) ||
    (expanded[3] && effective[3] < FOURTH_PANEL_MIN_WIDTH)
  );
}
