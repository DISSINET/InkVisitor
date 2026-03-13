export enum EditMode {
  RAW = "raw",
  HIGHLIGHT = "highlight",
  SEMI = "semi",
}

export enum HighlightMode {
  SELECT = "select",
  BACKGROUND = "background",
  FOCUS = "focus",
  UNDERLINE = "underline",
}
export const LINE_HEIGHT = 24;
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_FONT = '"Roboto Mono", monospace';

/** Height of selection/background highlight as a fraction of line height (0–1). Smaller = narrower band, centered in the line. */
export const HIGHLIGHT_HEIGHT_RATIO = 0.75;

/** Pixels to raise the underline above the bottom of the line band (UNDERLINE mode). Larger = smaller margin below text. */
export const UNDERLINE_OFFSET_PX = 2.5;
