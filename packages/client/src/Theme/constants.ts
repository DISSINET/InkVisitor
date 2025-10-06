import { EntityEnums } from "@shared/enums";

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
export const COLLAPSED_PANEL_WIDTH = 31;
export const FIRST_PANEL_MIN_WIDTH = 100;
export const SECOND_PANEL_MIN_WIDTH = 420;
export const THIRD_PANEL_MIN_WIDTH = 300;
export const FOURTH_PANEL_MIN_WIDTH = 192;
// % PERCENT PANEL WIDTHS for 1440px
export const INIT_PERCENT_PANEL_WIDTHS = [10, 41, 34, 15];
// % PERCENT PANEL WIDTHS for less than 1400px = sacrifice editor
export const SMALL_SCREEN_LIMIT = 1400;
export const INIT_PERCENT_PANEL_WIDTHS_SMALL_SCREEN = [11, 39, 32, 18];
// % PERCENT PANEL WIDTHS for more than 1900px
export const LARGE_SCREEN_LIMIT = 1900;
export const INIT_PERCENT_PANEL_WIDTHS_LARGE_SCREEN = [10, 40, 36, 14];

export const MAIN_PAGE_TREE_SEPARATOR_X_PERCENT_POSITION =
  INIT_PERCENT_PANEL_WIDTHS[0];
export const MAIN_PAGE_CENTER_SEPARATOR_X_PERCENT_POSITION =
  INIT_PERCENT_PANEL_WIDTHS[0] + INIT_PERCENT_PANEL_WIDTHS[1];
export const MAIN_PAGE_SEARCH_SEPARATOR_X_PERCENT_POSITION =
  INIT_PERCENT_PANEL_WIDTHS[0] +
  INIT_PERCENT_PANEL_WIDTHS[1] +
  INIT_PERCENT_PANEL_WIDTHS[2];

// breakpoint for annotator width too small
export const ANNOTATOR_TOO_SMALL_BREAKPOINT = 560;
// breakpoint for editor width too small
export const EDITOR_TOO_SMALL_BREAKPOINT = 480;
// height of class selector for highlight in annotator
export const ANNOTATOR_SELECTOR_HEIGHT = 27;

// BOXES
export const hiddenBoxHeight = 33;
export const fourthPanelBoxesHeightThirds = {
  search: 40,
  bookmarks: 27,
  templates: 33,
};

// the minimum pixels for the results section height
export const MIN_SEARCH_RESULT_HEIGHT = 100;
export const COLLAPSED_TABLE_WIDTH = 130;

// LIMITS
export const maxTabCount = 10;
export const maxTooltipTreeForks = 2;
export const maxTooltipMultiRelations = 5;

export const tooltipLabelSeparator = " • ";

export const SAFE_PASSWORD_DESCRIPTION =
  "A safe password: at least 12 characters, a combination of uppercase letters, lowercase letters, numbers, and symbols.";
export const MIN_LABEL_LENGTH_MESSAGE = "Fill in at least one character";

// animations
export const springConfig: { [key: string]: {} } = {
  panelExpand: { tension: 195, friction: 31 },
  separatorXPosition: { tension: 305, friction: 21, clamp: true },
};
