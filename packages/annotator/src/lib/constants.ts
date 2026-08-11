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
  /**
   * Point marker at each end of an anchor instead of a span fill (#2887).
   * Used for Territory anchors, whose span covers a whole territory and would
   * flood the fulltext if filled — only the start/end corner brackets are drawn.
   */
  ANCHOR = "anchor",
}
/**
 * Line height as a multiple of the font size (a CSS unitless line-height; for
 * scale: Google Docs defaults to 1.15, CSS `normal` is ~1.2). 23/13 is the
 * ratio of the historical fixed grid (23px lines, 13px font).
 */
export const DEFAULT_LINE_HEIGHT_RATIO = 23 / 13;

/**
 * Collapsed-caret width in CSS px. 2px (the Docs/VS Code convention) rather
 * than the native 1px: the caret must stay findable over the colored anchor
 * highlights and hover fades this canvas paints behind the text.
 */
export const DEFAULT_CARET_WIDTH_PX = 2;

/** Extra empty rows after the last text line; scrollable, no line numbers in the gutter. */
export const VIEWPORT_END_BUFFER_ROWS = 3;

/**
 * Extra rows scrollable above the first line, mirroring VIEWPORT_END_BUFFER_ROWS
 * at the end of the document. Line 1 is the one line a lineStart minimum of 0
 * could never scroll clear of; this headroom lets a floating UI bar pinned to
 * the canvas top be scrolled past it like any other line.
 *
 * Applied through Annotator.setTopScrollBuffer only while such a bar is open —
 * with no bar on screen the rows are empty space with nothing to reveal.
 *
 * Doubles as the clearance kept above a search hit: what the bar covers is what
 * a hit has to be scrolled clear of, so one distance serves both.
 */
export const VIEWPORT_START_BUFFER_ROWS = 2;
/** Logical font size in CSS px (one of the sizes the settings overlay offers). */
export const DEFAULT_FONT_SIZE = 14;
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

/**
 * Paragraph rendering (#2076). A paragraph is one segment of {@link Text} — the
 * span between two hard newlines — and every other visual line inside it is a
 * soft wrap. Left-aligned text gives no signal which of the two a line break is,
 * so the first visual line of each paragraph is indented; the wrapped
 * continuations stay flush left and the contrast marks the boundary. The
 * renderer draws on a fixed line grid (one line height per visual line,
 * relied on by scrolling, hit-testing and the gutter), so the horizontal axis is
 * where a paragraph can be marked without paying for variable line boxes.
 */
/** First-line indent of a paragraph, in ems of the current font size. */
export const PARAGRAPH_INDENT_EM = 2;
/**
 * Ceiling on the indent as a fraction of the wrap budget. A narrow panel or a
 * large font can make the nominal indent most of a line, leaving a first line
 * with room for a word or two; the cap keeps the paragraph readable there.
 */
export const PARAGRAPH_INDENT_MAX_RATIO = 0.25;
/**
 * Whether paragraphs are indented. On: the indent answers a question the reader
 * would otherwise have no way to answer — which line breaks are paragraph
 * boundaries — so it starts enabled; the settings overlay carries the opt-out,
 * and `Annotator.setParagraphIndent` is the same switch for a host.
 */
export const PARAGRAPH_INDENT_DEFAULT = true;
/**
 * The end-of-paragraph mark is stroked as a path rather than set as the "¶"
 * character: a text glyph arrives at the weight of whatever font is active
 * (the monospace face draws a heavy, slab-sided one) and shifts with every
 * font setting, where a path keeps one thin, quiet shape everywhere.
 */
/** Opacity of the paragraph mark, so it reads as chrome rather than as text. */
export const PARAGRAPH_MARK_ALPHA = 0.35;
/** Gap between the last character of a paragraph and its mark, in char widths. */
export const PARAGRAPH_MARK_GAP_RATIO = 0.5;
/** Total height of the mark as a fraction of one line height. */
export const PARAGRAPH_MARK_HEIGHT_RATIO = 0.5;
/** Radius of the mark's bowl as a fraction of its height: a bowl half as deep as the stems. */
export const PARAGRAPH_MARK_BOWL_RATIO = 0.25;
/** Distance between the mark's two stems as a fraction of its height. */
export const PARAGRAPH_MARK_STEM_GAP_RATIO = 0.2;
/** How far the top bar runs past the trailing stem, as a fraction of the gap between them. */
export const PARAGRAPH_MARK_OVERHANG_RATIO = 0.6;
/** How far the top bar reaches past the bowl's leading edge, in CSS px (scaled by ratio at draw time). */
export const PARAGRAPH_MARK_CAP_LEAD_PX = 1;
/** Thickness of the mark's stems and cap, in CSS px (scaled by ratio at draw time). */
export const PARAGRAPH_MARK_LINE_WIDTH_PX = 1;

/** Height of selection/background highlight as a fraction of line height (0–1). Smaller = narrower band, centered in the line. */
export const HIGHLIGHT_HEIGHT_RATIO = 0.75;

/** Pixels to raise the underline above the bottom of the line band (UNDERLINE mode). Larger = smaller margin below text. */
export const UNDERLINE_OFFSET_PX = 2;

/**
 * #2325 — an entity span (BACKGROUND fill, UNDERLINE) leaves this many CSS px
 * unpainted at each of its outer edges, scaled by the device pixel ratio at
 * draw time. Two same-colour anchors can meet with no whitespace character
 * between them; each giving up its own edge parts them by twice this value, so
 * the layer underneath shows through as a separator and the pair reads as two
 * anchors. Applied only at a span's true start/end, never at soft-wrap edges.
 *
 * Fractional on purpose: a monospace cell holds almost no side bearing on a wide
 * glyph (m, w), so a full pixel bitten off the leading edge puts the fill inside
 * the ink. A sub-pixel inset lands as an antialiased edge — the separator still
 * reads, and the glyph keeps its cell.
 */
export const HIGHLIGHT_SPAN_EDGE_GAP_PX = 0.75;

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

/**
 * Issue #2887 — Territory (T) anchor markers. An L-shaped corner at the anchor
 * start and an inverse-L at the end, framing the territory span without filling
 * it. All values are in CSS px / line-relative ratios and scaled by the device
 * pixel ratio at draw time.
 */
/**
 * Vertical arm length as a multiple of the font size. Keyed to the text rather
 * than to the line box: the marker frames the letters, whose size is unchanged
 * by the line-spacing setting, so one glyph height serves every spacing.
 */
export const ANCHOR_MARKER_ARM_H_EM = 1.24;
/**
 * Ceiling on the arm length as a fraction of one line height. At the tightest
 * spacings a font-sized arm would reach into the rows above and below, where it
 * reads as a marker on the neighbouring line.
 */
export const ANCHOR_MARKER_ARM_H_MAX_LINE_RATIO = 0.8;
/** Horizontal arm length as a fraction of one character width. */
export const ANCHOR_MARKER_ARM_W_RATIO = 0.8;
/** Stroke width of the corner glyph, in CSS px (scaled by ratio at draw time). */
export const ANCHOR_MARKER_LINE_WIDTH_PX = 1.5;
/** Horizontal offset per stacked marker at a shared position, in CSS px. */
export const ANCHOR_MARKER_STACK_STEP_PX = 3;
/** Padding added around a marker glyph to form its hover hit target, in CSS px. */
export const ANCHOR_MARKER_HIT_PAD_PX = 4;
