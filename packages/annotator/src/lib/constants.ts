export enum EditMode {
  RAW = "XML",
  HIGHLIGHT = "highlight",
  SEMI = "text-edit",
}

export const editModeDisplayLabel: Record<EditMode, string> = {
  [EditMode.RAW]: "XML",
  [EditMode.HIGHLIGHT]: "highlight",
  [EditMode.SEMI]: "text edit",
};

export enum HighlightMode {
  SELECT = "select",
  BACKGROUND = "background",
  FOCUS = "focus",
  UNDERLINE = "underline",
}
export const LINE_HEIGHT = 23;

/** Extra empty rows after the last text line; scrollable, no line numbers in the gutter. */
export const VIEWPORT_END_BUFFER_ROWS = 3;
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_FONT = '"Roboto Mono", monospace';
/**
 * Fallback font family used when proportional mode is enabled without
 * an explicit family. The client passes the application's own font so the
 * annotator matches it (#2487); this generic keeps the annotator standalone.
 */
export const PROPORTIONAL_FONT = "sans-serif";

export interface MenuColors {
  bg: string;
  text: string;
  border: string;
  hover: string;
  accent: string;
  accentText: string;
  separator: string;
  disabled: string;
  buttonBg: string;
}

export const LIGHT_MENU_COLORS: MenuColors = {
  bg: "#ffffff",
  text: "#222",
  border: "#d0d0d0",
  hover: "#CCD5F4",
  accent: "#324185",
  accentText: "#ffffff",
  separator: "#e0e0e0",
  disabled: "#aaa",
  buttonBg: "#f5f5f5",
};

export const DARK_MENU_COLORS: MenuColors = {
  bg: "#060c26",
  text: "#fff",
  border: "#718096",
  hover: "#222A40",
  accent: "#677B9E",
  accentText: "#ffffff",
  separator: "#4a5568",
  disabled: "#718096",
  buttonBg: "#2d3748",
};

/** Height of selection/background highlight as a fraction of line height (0–1). Smaller = narrower band, centered in the line. */
export const HIGHLIGHT_HEIGHT_RATIO = 0.75;

/** Pixels to raise the underline above the bottom of the line band (UNDERLINE mode). Larger = smaller margin below text. */
export const UNDERLINE_OFFSET_PX = 2;

/** Fraction of one line height scrolled per frame while the pointer is outside the canvas (smooth autoscroll). */
export const SELECTION_EDGE_SCROLL_SPEED = 0.22;

/** Debounce delay in milliseconds for mousemove events (hover interactions). */
export const HOVER_DEBOUNCE_MS = 50;

/**
 * Issue #3108 — selection drag handles. All values are in CSS px and scaled by the
 * device-pixel ratio at draw/hit-test time.
 */
/** Width of the vertical bar drawn at each selection boundary. */
export const SELECTION_HANDLE_BAR_WIDTH_PX = 2;
/** Radius of the round knob drawn at the top (start) / bottom (end) of each bar. */
export const SELECTION_HANDLE_KNOB_RADIUS_PX = 4.5;
/**
 * Horizontal grab tolerance on each side of a boundary, in multiples of one
 * character width. ~1 char each side ("whole char before and after") keeps the
 * handle comfortably catchable on a monospace grid.
 */
export const SELECTION_HANDLE_GRAB_CHAR_FACTOR = 1;
