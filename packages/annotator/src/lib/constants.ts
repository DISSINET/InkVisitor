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

export const LINE_HEIGHT = 22;
export const FONT_SIZE = 13;

/** Height of selection/background highlight as a fraction of line height (0–1). Smaller = narrower band, centered in the line. */
export const HIGHLIGHT_HEIGHT_RATIO = 0.75;

/** Pixels to raise the underline above the bottom of the line band (UNDERLINE mode). Larger = smaller margin below text. */
export const UNDERLINE_OFFSET_PX = 2.5;
