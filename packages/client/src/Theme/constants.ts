import { EntityEnums } from "@shared/enums";
import theme from "./theme";

export const defaultPing = -10;

// wild card char used in search
export const wildCardChar = "*";

export const rootTerritoryId = "T0";
export const excludedSuggesterEntities = [EntityEnums.Class.Value];
export const scrollOverscanCount = 10;

// layout
export const heightHeader = 70;

export const minLayoutWidth = 1440;
export const layoutWidthBreakpoint = 1400;
// MORE PANEL WIDTHS
export const collapsedPanelWidth = 31;
export const secondPanelMinWidth = 480;
export const thirdPanelMinWidth = 450;
// % PERCENT PANEL WIDTHS
export const percentPanelWidths = [10, 31, 41, 18];
export const separatorXPercentPosition = 42;
// BOXES
export const hiddenBoxHeight = 33;
export const fourthPanelBoxesHeightThirds = {
  search: 40,
  bookmarks: 27,
  templates: 33,
};

// the minimum pixels for the results section height
export const MIN_SEARCH_RESULT_HEIGHT = 100;

// LIMITS
export const maxTabCount = 10;
export const maxTooltipTreeForks = 2;
export const maxTooltipMultiRelations = 5;

export const tooltipLabelSeparator = " • ";

// animations
export const springConfig: { [key: string]: {} } = {
  panelExpand: { tension: 195, friction: 31 },
  separatorXPosition: { tension: 305, friction: 21, clamp: true },
};

export const space1 = theme.space[1];
export const space2 = theme.space[2];
export const space3 = theme.space[3];
export const space4 = theme.space[4];
export const space5 = theme.space[5];
export const space6 = theme.space[6];
export const space7 = theme.space[7];
export const space8 = theme.space[8];
export const space9 = theme.space[9];
export const space10 = theme.space[10];
export const space12 = theme.space[12];
export const space16 = theme.space[16];
export const space20 = theme.space[20];
export const space22 = theme.space[22];
export const space23 = theme.space[23];
export const space24 = theme.space[24];
export const space28 = theme.space[28];
export const space32 = theme.space[32];
export const space36 = theme.space[36];
export const space40 = theme.space[40];
export const space48 = theme.space[48];
export const space56 = theme.space[56];
export const space64 = theme.space[64];
