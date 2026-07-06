import Cursor, { DIRECTION } from "./Cursor";
import Highlighter, { IAbsCoordinates, CursorStyle } from "./Highlighter";
import History, { HistorySnapshot } from "./History";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";
import { CaretBlink } from "./CaretBlink";
import { ResizePulse } from "./ResizePulse";
import { SettingsOverlay, SettingControl } from "./SettingsOverlay";
import Keys from "./Keys";
import { Lines } from "./Lines";
import Scroller from "./Scroller";
import Text, { Tag, SegmentPosition, CaretAffinity } from "./Text";
import { drawAnchorMarker } from "./AnchorMarker";
import { CanvasMeasurer } from "./TextMeasurer";
import Viewport from "./Viewport";
import { AsymmetricalAnchor, Warnings, WarningData } from "./warnings";
import {
  ANCHOR_MARKER_ARM_H_RATIO,
  ANCHOR_MARKER_ARM_W_RATIO,
  ANCHOR_MARKER_HIT_PAD_PX,
  ANCHOR_MARKER_LINE_WIDTH_PX,
  ANCHOR_MARKER_STACK_STEP_PX,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  PROPORTIONAL_FONT,
  EditMode,
  HighlightMode,
  HOVER_DEBOUNCE_MS,
  LINE_HEIGHT,
  SELECTION_EDGE_SCROLL_SPEED,
  SELECTION_HANDLE_BAR_WIDTH_PX,
  SELECTION_HANDLE_GRAB_CHAR_FACTOR,
  SELECTION_HANDLE_KNOB_RADIUS_PX,
  VIEWPORT_END_BUFFER_ROWS,
  LIGHT_MENU_COLORS,
  MenuColors,
} from "./constants";

// Updated regex to properly handle tags with attributes
// Opening tags: <tagname attr="value"> or <tagname>
// Handles UUIDs, alphanumeric, hyphens, underscores, and attributes
const openingTagRegex = /<([a-zA-Z0-9\-_]+(?:\s+[^>]*)?)>/g;
// Closing tags: </tagname>
// Handles UUIDs, alphanumeric, hyphens, underscores
export const closingTagRegex = /<\/([a-zA-Z0-9\-_]+)>/g;
// General tag removal regex
export const tagRemovalRegex = /<\/?[^<>]+?>/g;
// Creates a new regex instance for opening tags (no shared state)
export const createOpeningTagRegex = () =>
  new RegExp(openingTagRegex.source, openingTagRegex.flags);

// Line-wrap tokenizer (Text.calculateLines): splits text into atomic tags
// (<...>), whitespace runs, word runs, and punctuation runs (or a stray "<").
// Stateful global regex — callers must reset lastIndex before each exec loop.
export const wrapTokenRegex = /(<[^>]+>)|(\s+)|([\w']+)|([^\s\w'<]+|<)/g;

// Opening tag with specific name and optional attributes: <tagname attr="value"> or <tagname>
export const createSpecificOpeningTagRegex = (tagName: string) =>
  new RegExp(`<${tagName}(?:\\s+[^>]*)?>`, "g");

/**
 * Full-string match for one complete piece of tag markup, mirroring exactly
 * what the parser recognizes (openingTagRegex / closingTagRegex): a closing
 * tag has no attributes; an opening tag may. Literal "<"/">" sequences that
 * don't form a valid tag are ordinary text characters.
 */
const wholeTagRegex = /^(?:<\/[a-zA-Z0-9\-_]+>|<[a-zA-Z0-9\-_]+(?:\s+[^>]*)?>)$/;

/** Extracts the tag name from a complete markup string like `</e1>` or `<e1 elvl="1">`. */
const getTagNameFromMarkup = (markup: string): string =>
  markup.replace(/^<\/?/, "").replace(/>$/, "").trim().split(/\s+/)[0];

/** Identifies an anchor by its opening tag's location (Tag.position semantics). */
export interface AnchorOpenTagRef {
  segmentIndex: number;
  position: number;
}

export type MoveAnchorBoundaryStatus =
  | "moved"
  | "blocked-bounds"
  | "blocked-same-name"
  | "not-found";

export interface MoveAnchorBoundaryResult {
  status: MoveAnchorBoundaryStatus;
  /** Present when status === "moved": the opening tag's new location, for the next call. */
  openTagRef?: AnchorOpenTagRef;
}

/** One live annotator per host element — a new constructor tears down the previous (#3092). */
const canvasHosts = new WeakMap<HTMLCanvasElement, Annotator>();
const scrollerHosts = new WeakMap<HTMLDivElement, Annotator>();
const linesHosts = new WeakMap<HTMLCanvasElement, Annotator>();

// Occurrence holds exact position of a point in text
export interface Occurrence {
  segmentIndex: number;
  lineIndex: number;
  start: number;
  end: number;
}

export interface HighlightSchema {
  mode: HighlightMode;
  style: {
    color: string;
    opacity: number;
  };
}

/** localStorage key for persisted user settings (caret width, colors, FPS). */
const SETTINGS_STORAGE_KEY = "inkvisitor.annotator.settings";

interface PersistedSettings {
  caretWidth?: number;
  highlightColor?: string;
  showFps?: boolean;
  proportional?: boolean;
  fontFamily?: string;
  fontSize?: number;
}

// DrawingOptions bundles required sizes shared by multiple components while drawing into canvas
export interface DrawingOptions {
  charWidth: number;
  lineHeight: number;
  charsAtLine: number;
  color?: string; // override
  caretWidth?: number; // collapsed-caret width in device px (defaults to 1)
  caretVisible?: boolean; // blink phase: skip painting the collapsed caret when false (#3092)
  /**
   * Proportional column→pixel resolver. When present (and the caller
   * passes the absolute visual line), draw uses measured widths instead of
   * `col * charWidth`. Absent on the monospace path.
   */
  columnToPixelX?: (absLine: number, col: number) => number;
}

export interface Selected {
  text: string;
  anchors: Tag[];
  index: number;
}

/**
 * Annotator is main wrapping class around HTMLCanvasElement
 */
export class Annotator {
  // canvas element
  element: HTMLCanvasElement;
  // cached canvas contex
  ctx: CanvasRenderingContext2D;

  font: string = `${DEFAULT_FONT_SIZE}px ${DEFAULT_FONT}`;
  /** Logical font size in CSS px (device px = `fontSize * ratio`). */
  fontSize: number = DEFAULT_FONT_SIZE;
  /** Font family used in proportional mode (monospace mode is always DEFAULT_FONT). */
  proportionalFontFamily: string = PROPORTIONAL_FONT;
  /** Font-family options for the Options-modal dropdown (supplied by the host). */
  fontFamilyOptions: { label: string; value: string }[] = [];

  fontColor: string = "black";
  bgColor: string = "white";

  private _menuColors: MenuColors = LIGHT_MENU_COLORS;
  get menuColors(): MenuColors {
    return this._menuColors;
  }
  set menuColors(c: MenuColors) {
    this._menuColors = c;
    this.contextMenu.colors = c;
    if (this.settingsOverlay.isOpen) {
      this.openSettings();
    }
  }
  selectColor: string = "rgba(0, 0, 0)";
  selectOpacity: number = 0.5;

  charWidth: number = 0;
  /**
   * Proportional feature flag (default off). When on, the rendered font switches
   * to a proportional family and text layout, draw (caret/selection rects),
   * wrapping, mouse hit-test, drag handles, and vertical goal-column all use
   * measured glyph widths via a CanvasMeasurer instead of the monospace grid.
   *
   * Functionally complete, verified by the proportional test suites. Exposed to
   * users as an OPT-IN (the client's font toggle calls {@link setProportional});
   * the annotator default stays monospace. Flipping the default ON for everyone
   * is the one deliberately-not-done step.
   */
  proportional: boolean = false;
  lineHeight: number = LINE_HEIGHT;

  inputText: string = "";

  // size for virtual area inside the canvas element
  width: number = 0;
  height: number = 0;

  // components here
  viewport: Viewport;
  cursor: Cursor;
  hoverHighlighter: Highlighter; // For statement list hover interaction
  hoverRegions: { start: IAbsCoordinates; end: IAbsCoordinates }[] = [];
  hoverTagName: string | null = null; // Tag name last passed to highlightAnchorByTag; recomputed on resize.
  text: Text;
  scroller?: Scroller;
  lines?: Lines;
  keys: Keys;
  warnings: Warnings;
  contextMenu: ContextMenu = new ContextMenu();
  settingsOverlay: SettingsOverlay = new SettingsOverlay();

  /** Blinks the collapsed text caret at 1Hz; repaints via draw() (#3092). */
  private readonly caretBlink: CaretBlink;

  // #2885 — anchor-resize mode. While active the anchor being resized pulses
  // (its own class colour, animated opacity) and the original text selection is
  // frozen but not painted, so the blue selection is hidden yet its position is
  // preserved for restoration on exit.
  private readonly resizePulse: ResizePulse;
  private resizeAnchor: { tagName: string; openTagRef: AnchorOpenTagRef } | null = null;
  /** When true, the cursor selection is kept but neither painted nor reported via onSelectText. */
  private selectionHidden: boolean = false;

  private deferredInitTimeout?: ReturnType<typeof setTimeout>;

  private destroyed = false;

  /** Whether the main canvas currently has keyboard focus. */
  private canvasFocused = false;

  /** Bounded undo/redo stack of document snapshots (#3086). */
  history: History = new History();

  annotatedPosition: SegmentPosition | null = null;

  // to control highlightChangeCb callback
  lastSelectedText?: Selected;
  ratio: number = 1;

  previousRenderViewportLineStart: number;

  private lastSelectPointer: { cx: number; cy: number } | null = null;

  private selectionScrollRaf: number = 0;

  /**
   * Reusable scratch cursor for pointerToVisual, which runs in the mousemove /
   * edge-scroll hot path. Avoids a per-event Cursor allocation. Never read for
   * its selection state — only xLine/yLine after setPositionFromCanvasOffsets.
   */
  private readonly scratchCursor: Cursor = new Cursor(this.ratio, 0, 0);

  /**
   * Issue #3108 — active selection-handle drag. `start`/`end` resize one boundary
   * (keeping the other fixed, min 1 char, no crossing); `span` slides the whole
   * highlight (preserving its length). `null` when no handle drag is in progress.
   */
  private dragHandle: "start" | "end" | "span" | null = null;
  /** Whether the pointer actually moved during the current handle drag. */
  private handleDragMoved = false;
  /** Captured offsets at the start of a whole-span drag (raw indices into Text.value). */
  private spanDragState: {
    startOff: number;
    endOff: number;
    grabOff: number;
  } | null = null;

  /** Collapsed-caret width in CSS px (scaled by ratio at draw time). */
  private caretWidth = 1;

  /**
   * User-chosen selection highlight color (`#rrggbb`), or undefined to defer to
   * the host theme set via setSelectStyle. When set it wins over the theme.
   */
  private highlightColor: string | undefined = undefined;

  /** Debug FPS counter — smoothed frames-per-second of draw() calls. */
  private showFps = false;
  private lastFrameTime = 0;
  private fps = 0;

  // callbacks
  onSelectTextCb?: (text: Selected) => void;
  // A tag may map to several treatments at once (#2887): the active territory
  // is both dimmed (FOCUS) and marked at its ends (ANCHOR). Returning an array
  // draws each; a single schema (or void) keeps the original behaviour.
  onHighlightCb?: (entityId: string) => HighlightSchema | HighlightSchema[] | void;
  onTextChangeCb?: (text: string) => void;
  onScrollCb?: (line: number) => void;
  onAnchorHoverCb?: (tags: Tag[]) => void; // Part 2 of #2835
  onAnchorTagHoverCb?: (tag: Tag | null, position: { x: number; y: number } | null) => void;

  /**
   * #2887 — hit rectangles for the Territory anchor markers drawn this frame,
   * in draw coordinates (device px, before the scroll translate), each paired
   * with its anchor Tag. Repopulated every draw; consumed by
   * detectAndEmitAnchorTagHover so hovering a marker previews its territory
   * through the same channel the RAW `<id>` markup hover already uses.
   */
  private anchorMarkerHitboxes: {
    x: number;
    y: number;
    w: number;
    h: number;
    tag: Tag;
  }[] = [];

  clickCount: number;
  clickTimeout?: NodeJS.Timeout;
  hoverDebounceTimeout?: NodeJS.Timeout; // For debouncing mousemove events

  private readonly boundOnMouseMove = (e: MouseEvent) => this.onMouseMove(e);

  private readonly boundOnContextMenu = (e: MouseEvent) => this.onContextMenu(e);

  private readonly boundOnMouseDoubleClick = (e: MouseEvent) => this.onMouseDoubleClick(e);

  private readonly boundOnCanvasMouseLeave = () => {
    if (this.hoverDebounceTimeout) {
      clearTimeout(this.hoverDebounceTimeout);
      this.hoverDebounceTimeout = undefined;
    }
    this.onAnchorHoverCb?.([]);
    this.onAnchorTagHoverCb?.(null, null);
    // Don't strand a resize/move cursor when leaving the canvas (#3108). Keep it
    // while a drag is in progress (the pointer is allowed to leave the canvas).
    if (!this.dragHandle) {
      this.element.style.cursor = "";
    }
  };

  private readonly boundOnCanvasFocus = () => {
    this.canvasFocused = true;
    this.caretBlink.reset();
    this.draw();
  };

  private readonly boundOnCanvasBlur = () => {
    this.canvasFocused = false;
    this.draw();
  };

  /** Issue #3108 — document-level move while dragging a selection handle. */
  private readonly onDocumentHandleMove = (e: MouseEvent) => {
    if (!this.dragHandle) {
      return;
    }
    this.handleDragMoved = true;
    this.lastSelectPointer = { cx: e.clientX, cy: e.clientY };
    this.applyHandleDrag(e.clientX, e.clientY);
    this.draw();
    this.ensureSelectionEdgeScrollRunning();
  };

  /** Issue #3108 — document-level release that finalizes a selection-handle drag. */
  private readonly onDocumentHandleUp = (e: MouseEvent) => {
    this.endHandleDrag(e);
  };

  constructor(element: HTMLCanvasElement, inputText: string, ratio: number = 1) {
    canvasHosts.get(element)?.destroy();

    this.element = element;

    this.caretBlink = new CaretBlink(() => {
      if (!this.destroyed) {
        this.draw();
      }
    });

    this.resizePulse = new ResizePulse(() => {
      if (!this.destroyed) {
        this.draw();
      }
    });

    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context");
    }

    this.ratio = ratio;
    this.font = this.composeFont();

    this.lineHeight = this.lineHeightForSize(this.fontSize);

    this.ctx = ctx;
    this.width = Number(this.element.style.width.replace("px", "")) * this.ratio;
    this.height = Number(this.element.style.height.replace("px", "")) * this.ratio;

    this.element.width = this.width;
    this.element.height = this.height;

    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    const charsAtLine = Math.floor(this.width / this.charWidth);

    const noLinesViewport = this.viewportFullRowCount() + 1;

    this.viewport = new Viewport(0, noLinesViewport);

    this.inputText = inputText;
    this.text = new Text(this.inputText, charsAtLine);

    this.cursor = new Cursor(this.ratio, 0, 0);

    // Initialize hover highlighter for statement list interaction (#2835)
    this.hoverHighlighter = new Highlighter(
      this.ratio,
      {
        color: "rgba(255, 200, 0, 0.3)", // Light yellow/orange
        opacity: 0.3,
        selectorColor: "rgba(255, 200, 0, 0.5)",
      },
      HighlightMode.BACKGROUND
    );

    this.keys = new Keys(this);
    this.warnings = new Warnings();

    this.bgColor = this.element.style.backgroundColor || "white";
    this.fontColor = this.element.style.color || "black";

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.element.addEventListener("dblclick", this.boundOnMouseDoubleClick);
    this.element.addEventListener("mousemove", this.boundOnMouseMove);
    this.element.addEventListener("mouseleave", this.boundOnCanvasMouseLeave);
    this.element.addEventListener("contextmenu", this.boundOnContextMenu);
    this.element.addEventListener("focus", this.boundOnCanvasFocus);
    this.element.addEventListener("blur", this.boundOnCanvasBlur);

    this.clickCount = 0;

    this.previousRenderViewportLineStart = 0;

    canvasHosts.set(element, this);

    this.loadSettings();

    this.draw();

    this.deferredInitTimeout = setTimeout(() => {
      this.deferredInitTimeout = undefined;
      if (this.destroyed) {
        return;
      }
      this.resize();
      this.runWarningChecks();
    });
  }

  setSelectStyle(selectColor: string, selectOpacity: number, selectorColor: string) {
    this.selectColor = selectColor;
    this.selectOpacity = selectOpacity;

    this.cursor.style = {
      color: this.selectColor,
      opacity: this.selectOpacity,
      selectorColor: selectorColor,
    } as CursorStyle;

    // A user-chosen highlight color (persisted) takes precedence over the theme.
    if (this.highlightColor !== undefined) {
      this.cursor.style = {
        ...this.cursor.style,
        color: this.highlightColor,
      };
    }
  }

  /**
   * Styles the hover highlight for statement-list → text anchor feedback (#2835).
   * The library has no theme; pass colors from the app (e.g. React `useTheme()`).
   */
  setHoverHighlightStyle(style: Partial<CursorStyle>): void {
    this.hoverHighlighter.setStyle(style);
  }

  /**
   * removeAnchorFromSelection removes anchor from selected text
   * @param anchor
   */
  removeAnchorFromSelection(anchorTag: Tag) {
    const anchor = anchorTag.getTagName();
    const anchorSegIdx = anchorTag.segmentIndex;
    const anchorPos = anchorTag.position;

    const changedSegmentIndices = new Set<number>();

    const openSegment = this.text.segments[anchorSegIdx];
    if (!openSegment) {
      return;
    }

    const openTag = openSegment.openingTags.find(
      (tag) => tag.getTagName() === anchor && tag.position === anchorPos
    );

    let closeTag: Tag | undefined;
    let closeSegIdx = -1;
    for (let i = anchorSegIdx; i < this.text.segments.length; i++) {
      const seg = this.text.segments[i];
      const candidates =
        i === anchorSegIdx
          ? seg.closingTags.filter((t) => t.position > anchorPos)
          : seg.closingTags;
      closeTag = candidates.find((tag) => tag.getTagName() === anchor);
      if (closeTag) {
        closeSegIdx = i;
        break;
      }
    }

    // FIRST: Capture old selection bounds and tag positions BEFORE modifying anything
    const [start, end] = this.cursor.getAbsBounds();
    let hasSelection = false;
    let oldStartIndex: number | undefined;
    let oldEndIndex: number | undefined;

    if (start && end) {
      hasSelection = true;
      // Use current mode (not forced raw mode) since cursor positions are in current mode
      oldStartIndex = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(start.yLine, start.xLine)
      );
      oldEndIndex = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(end.yLine, end.xLine)
      );
    }

    // Calculate absolute positions of the tags we're removing (before modifying segments)
    let openTagAbsPos: number | undefined;
    if (openTag) {
      let absPos = 0;
      for (let i = 0; i < anchorSegIdx; i++) {
        absPos += this.text.segments[i].raw.length + 1; // +1 for newline
      }
      absPos += anchorPos;
      openTagAbsPos = absPos;
    }

    let closeTagAbsPos: number | undefined;
    if (closeTag && closeSegIdx !== -1) {
      let absPos = 0;
      for (let i = 0; i < closeSegIdx; i++) {
        absPos += this.text.segments[i].raw.length + 1; // +1 for newline
      }
      absPos += closeTag.position;
      closeTagAbsPos = absPos;
    }

    // NOW: Remove the tags from segments
    if (closeTag && closeSegIdx !== -1) {
      const closeSeg = this.text.segments[closeSegIdx];
      const closePos = closeTag.position;
      closeSeg.raw =
        closeSeg.raw.slice(0, closePos) + closeSeg.raw.slice(closePos + closeTag.getTagLength());
      changedSegmentIndices.add(closeSegIdx);
    }

    if (openTag) {
      openSegment.raw =
        openSegment.raw.slice(0, anchorPos) +
        openSegment.raw.slice(anchorPos + openTag.getTagLength());
      changedSegmentIndices.add(anchorSegIdx);
    }

    // Reparse segments and reassign text
    for (const idx of changedSegmentIndices) {
      this.text.segments[idx]?.parseText();
    }

    this.text.assignValueFromSegments();
    this.text.calculateLines();

    // Recalculate selection bounds after anchor removal (issue #2899)
    if (hasSelection && oldStartIndex !== undefined && oldEndIndex !== undefined) {
      let newStartIndex = oldStartIndex;
      let newEndIndex = oldEndIndex;

      // Adjust indices based on removed tag positions
      const openTagLen = openTag ? openTag.getTagLength() : 0;
      const closeTagLen = closeTag ? closeTag.getTagLength() : 0;

      // If opening tag was before or at the start position, shift start back
      if (openTagAbsPos !== undefined && openTagAbsPos <= oldStartIndex) {
        newStartIndex -= openTagLen;
      }

      // If opening tag was before the end position, shift end back
      if (openTagAbsPos !== undefined && openTagAbsPos < oldEndIndex) {
        newEndIndex -= openTagLen;
      }

      // If closing tag was before the end position, shift end back further
      if (closeTagAbsPos !== undefined && closeTagAbsPos < oldEndIndex) {
        newEndIndex -= closeTagLen;
      }

      // Convert adjusted indices back to segment positions
      const newStartSegPos = this.text.getSegmentFromAbsTextIndex(newStartIndex);
      const newEndSegPos = this.text.getSegmentFromAbsTextIndex(newEndIndex);

      if (newStartSegPos && newEndSegPos) {
        const startSegment = this.text.segments[newStartSegPos.segmentIndex];
        const endSegment = this.text.segments[newEndSegPos.segmentIndex];

        // Update cursor selection bounds
        this.cursor.selectStart = {
          xLine: newStartSegPos.charInLineIndex,
          yLine: startSegment.lineStart + newStartSegPos.lineIndex,
        };
        this.cursor.selectEnd = {
          xLine: newEndSegPos.charInLineIndex,
          yLine: endSegment.lineStart + newEndSegPos.lineIndex,
        };
        this.cursor.setTrueSelectionDirection();
      } else {
        // Fallback: reset cursor if position calculation fails
        this.cursor.reset();
      }
    }

    this.runWarningChecks();
    this.draw();
  }

  /**
   * Highlights all anchors with the given tag name (for statement list hover interaction).
   * Part 1 of issue #2835: When hovering over statement list, highlight the anchor in annotator.
   *
   * @param tagName - The entity/tag name to highlight (e.g., "entity-id-123")
   */
  highlightAnchorByTag(tagName: string) {
    if (!tagName) {
      this.clearHoverHighlight();
      return;
    }

    this.hoverTagName = tagName;
    if (!this.refreshHoverHighlightRegions()) {
      this.clearHoverHighlight();
      return;
    }
    this.draw();
  }

  private refreshHoverHighlightRegions(): boolean {
    const tagName = this.hoverTagName;
    if (!tagName) {
      return false;
    }

    // Find all opening tags with this tag name across all segments
    const matchingTags: Tag[] = [];
    for (const segment of this.text.segments) {
      const foundTags = segment.openingTags.filter((tag) => tag.getTagName() === tagName);
      matchingTags.push(...foundTags);
    }

    if (matchingTags.length === 0) {
      return false;
    }

    // Collect one highlight region per anchor occurrence. Merging them into a
    // single min→max bounding span would visually connect anchors of the same
    // statement that are not adjacent (#3017). Pair each opening tag with the
    // correct closing tag (depth-aware), same as detectAndEmitAnchorHover. Raw
    // content span: [openEnd, closeStart) — see Tag docs in Text.
    const regions: { start: IAbsCoordinates; end: IAbsCoordinates }[] = [];

    for (const openTag of matchingTags) {
      const match = this.findMatchingClosingTag(openTag);
      if (!match) {
        continue;
      }

      const openAbsRaw = openTag.getAbsoluteTagPosition(this.text.segments);
      const closeAbsRaw = match.closeTag.getAbsoluteTagPosition(this.text.segments);
      const contentStartAbsRaw = openAbsRaw + openTag.getTagLength();
      const contentEndExclusiveAbsRaw = closeAbsRaw;

      if (contentStartAbsRaw >= contentEndExclusiveAbsRaw) {
        continue;
      }

      const startSegPos = this.text.getSegmentFromAbsTextIndex(contentStartAbsRaw);
      const lastCharAbsRaw = contentEndExclusiveAbsRaw - 1;
      const lastSegPos = this.text.getSegmentFromAbsTextIndex(lastCharAbsRaw);

      if (!startSegPos || !lastSegPos) {
        continue;
      }

      const startSeg = this.text.segments[startSegPos.segmentIndex];
      const lastSeg = this.text.segments[lastSegPos.segmentIndex];
      if (!startSeg || !lastSeg) {
        continue;
      }

      const startLine = startSeg.lineStart + startSegPos.lineIndex;
      const startChar = startSegPos.charInLineIndex;
      const endLine = lastSeg.lineStart + lastSegPos.lineIndex;
      // Highlighter uses exclusive end xLine on the last line (see Highlighter.draw).
      const endExclusiveChar = lastSegPos.charInLineIndex + 1;

      regions.push({
        start: { xLine: startChar, yLine: startLine },
        end: { xLine: endExclusiveChar, yLine: endLine },
      });
    }

    if (regions.length === 0) {
      return false;
    }

    this.hoverRegions = regions;
    return true;
  }

  /**
   * Clears the hover highlight (for statement list hover interaction).
   */
  clearHoverHighlight() {
    this.hoverTagName = null;
    this.hoverRegions = [];
    this.hoverHighlighter.reset();
    this.draw();
  }

  /**
   * Finds the matching closing tag for an opening tag using depth-aware pairing.
   *
   * @param openTag - Opening tag to match
   * @returns Matching closing tag with its segment index, or null
   */
  private findMatchingClosingTag(openTag: Tag): { closeTag: Tag; closeSegIdx: number } | null {
    const tagName = openTag.getTagName();
    let depth = 0;

    for (let i = openTag.segmentIndex; i < this.text.segments.length; i++) {
      const seg = this.text.segments[i];
      const events: { tag: Tag; isOpen: boolean }[] = [];

      for (const candidateOpen of seg.openingTags) {
        if (
          candidateOpen.getTagName() === tagName &&
          (i > openTag.segmentIndex || candidateOpen.position >= openTag.position)
        ) {
          events.push({ tag: candidateOpen, isOpen: true });
        }
      }

      for (const candidateClose of seg.closingTags) {
        if (
          candidateClose.getTagName() === tagName &&
          (i > openTag.segmentIndex || candidateClose.position > openTag.position)
        ) {
          events.push({ tag: candidateClose, isOpen: false });
        }
      }

      events.sort((a, b) => {
        if (a.tag.position === b.tag.position) {
          if (a.isOpen === b.isOpen) return 0;
          return a.isOpen ? 1 : -1;
        }
        return a.tag.position - b.tag.position;
      });

      for (const event of events) {
        if (event.isOpen) {
          depth++;
          continue;
        }

        depth--;
        if (depth === 0) {
          return {
            closeTag: event.tag,
            closeSegIdx: i,
          };
        }
      }
    }

    return null;
  }

  /**
   * Detects anchors at the current mouse position and emits hover callback. When hovering over anchored text, emit tags to highlight statements.
   *
   * @param e - Mouse event
   */
  private detectAndEmitAnchorHover(e: MouseEvent) {
    if (!this.onAnchorHoverCb) {
      return;
    }

    // Calculate cursor position from mouse event
    const tempCursor = new Cursor(this.ratio, 0, 0);
    tempCursor.setPositionFromEvent(
      e,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart,
      this.proportionalHitTest()
    );

    // Clamp to valid line range
    tempCursor.yLine = Math.max(0, Math.min(tempCursor.yLine, Math.max(0, this.text.noLines - 1)));

    // Get segment position at cursor
    const segmentPos = this.text.getSegmentPosition(tempCursor.yLine, tempCursor.xLine);

    if (!segmentPos) {
      this.onAnchorHoverCb([]);
      return;
    }

    const segment = this.text.segments[segmentPos.segmentIndex];
    if (!segment) {
      this.onAnchorHoverCb([]);
      return;
    }

    const tagsAtPosition: Tag[] = [];
    const hoverAbsRawIndex = this.text.getAbsTextIndexFromPosition(segmentPos);

    for (const currentSegment of this.text.segments) {
      for (const openTag of currentSegment.openingTags) {
        const match = this.findMatchingClosingTag(openTag);
        if (!match) {
          continue;
        }

        const openAbsRawStart = openTag.getAbsoluteTagPosition(this.text.segments);
        const closeAbsRawStart = match.closeTag.getAbsoluteTagPosition(this.text.segments);
        const contentStart = openAbsRawStart + openTag.getTagLength();
        const contentEnd = closeAbsRawStart;

        if (hoverAbsRawIndex >= contentStart && hoverAbsRawIndex < contentEnd) {
          tagsAtPosition.push(openTag);
        }
      }
    }

    this.onAnchorHoverCb(tagsAtPosition);
  }

  /**
   * Detects whether the mouse is over tag markup (`<tag>` or `</tag>`) and
   * emits the owning opening Tag, or null when not over any markup.
   *
   * In RAW mode this reports `<id>` markup under the pointer. In HIGHLIGHT mode
   * markup is hidden, but Territory anchor corner markers (#2887) are drawn and
   * hit-tested here first, so hovering a marker previews its territory through
   * the same channel. The marker hitbox list is empty outside HIGHLIGHT, so the
   * prefix is inert there — no mode branch required.
   */
  private detectAndEmitAnchorTagHover(e: MouseEvent) {
    if (!this.onAnchorTagHoverCb) {
      return;
    }

    const markerTag = this.hitTestAnchorMarker(e);
    if (markerTag) {
      this.onAnchorTagHoverCb(markerTag, { x: e.pageX, y: e.pageY });
      return;
    }

    const tempCursor = new Cursor(this.ratio, 0, 0);
    tempCursor.setPositionFromEvent(
      e,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart,
      this.proportionalHitTest()
    );

    tempCursor.yLine = Math.max(0, Math.min(tempCursor.yLine, Math.max(0, this.text.noLines - 1)));

    const segmentPos = this.text.getSegmentPosition(tempCursor.yLine, tempCursor.xLine);

    if (!segmentPos) {
      this.onAnchorTagHoverCb(null, null);
      return;
    }

    const position = { x: e.pageX, y: e.pageY };
    const hoverAbsRawIndex = this.text.getAbsTextIndexFromPosition(segmentPos);

    for (const segment of this.text.segments) {
      for (const openTag of segment.openingTags) {
        const openStart = openTag.getAbsoluteTagPosition(this.text.segments);
        const openEnd = openStart + openTag.getTagLength();

        if (hoverAbsRawIndex >= openStart && hoverAbsRawIndex < openEnd) {
          this.onAnchorTagHoverCb(openTag, position);
          return;
        }

        const match = this.findMatchingClosingTag(openTag);
        if (!match) {
          continue;
        }

        const closeStart = match.closeTag.getAbsoluteTagPosition(this.text.segments);
        const closeEnd = closeStart + match.closeTag.getTagLength();

        if (hoverAbsRawIndex >= closeStart && hoverAbsRawIndex < closeEnd) {
          this.onAnchorTagHoverCb(openTag, position);
          return;
        }
      }
    }

    this.onAnchorTagHoverCb(null, null);
  }

  onCanvasResize() {
    this.width = Number(this.element.style.width.replace("px", "")) * this.ratio;
    this.height = Number(this.element.style.height.replace("px", "")) * this.ratio;

    this.element.width = this.width;
    this.element.height = this.height;

    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    // Line reflow changes visual line/char indices; capture canonical offsets first.
    this.cursor.reconcileOffsetsFromVisual(this.text);

    const noLinesViewport = this.viewportFullRowCount() + 1;
    const charsAtLine = Math.floor(this.width / this.charWidth);

    const extent = this.scrollExtentLineCount();
    const positionBeforeRel = extent > 0 ? this.viewport.lineStart / Math.max(1, extent) : 0;

    this.viewport.updateLineEnd(noLinesViewport);
    // Keep the proportional wrap budget in sync with the new width
    // before the re-wrap (updateCharsAtLine triggers calculateLines once).
    if (this.proportional) {
      this.text.maxPixelWidth = this.width;
    }
    this.text.updateCharsAtLine(charsAtLine);

    this.cursor.syncVisualFromOffset(this.text);

    if (this.hoverTagName) {
      this.refreshHoverHighlightRegions();
    }

    // this function tries to keep the same relative position of the text even its not perfect
    // FIXME: Ideally we should find the exact text at the top of the viewport and try to keep it on top after the resize
    this.viewport.scrollTo(
      Math.floor(positionBeforeRel * this.scrollExtentLineCount()),
      this.scrollExtentLineCount()
    );

    this.scroller?.setRunnerSize((this.viewport.noLines / this.scrollExtentLineCount()) * 100);

    this.scroller?.setViewportSize(
      Math.min(100, (this.viewport.noLines / this.scrollExtentLineCount()) * 100)
    );

    if (this.settingsOverlay.isOpen) {
      this.settingsOverlay.reposition(this.element);
    }

    this.draw();
  }

  resize(): void {
    this.onCanvasResize();
  }

  onHighlight(cb: (entityId: string) => HighlightSchema | HighlightSchema[] | void): void {
    this.onHighlightCb = cb;
  }

  onTextChanged(cb: (text: string) => void): void {
    this.onTextChangeCb = cb;
  }

  onWarning(cb: (warning: WarningData) => void): void {
    this.warnings.onWarning(cb);
  }

  /**
   * onSelectText stores callback for changed Selected area
   * Will be used only if text really changes
   * @param cb
   */
  onSelectText(cb: (selection: Selected) => void) {
    this.lastSelectedText = undefined;
    this.onSelectTextCb = (selection: Selected) => {
      if (JSON.stringify(this.lastSelectedText) === JSON.stringify(selection)) {
        return;
      }
      this.lastSelectedText = selection;
      cb(selection);
    };
  }

  onScroll(cb: (line: number) => void) {
    this.onScrollCb = cb;
  }

  /**
   * Registers callback for anchor hover events (Part 2 of #2835).
   * Called when user hovers over anchored text in the annotator.
   *
   * @param cb - Callback receiving array of Tags at the hover position
   */
  onAnchorHover(cb: (tags: Tag[]) => void) {
    this.onAnchorHoverCb = cb;
  }

  /**
   * Registers callback fired when the mouse is over the tag markup itself
   * (e.g. `<anchor>` or `</anchor>`), not the content between them.
   * Emits the opening Tag for both opening and closing markup hits, or null
   * when the pointer leaves any tag markup.
   */
  onAnchorTagHover(cb: (tag: Tag | null, position: { x: number; y: number } | null) => void) {
    this.onAnchorTagHoverCb = cb;
  }

  /**
   * Toggle proportional text. When enabled, the rendered font switches
   * to `fontFamily` (the application's proportional font; falls back to
   * {@link PROPORTIONAL_FONT}) and a CanvasMeasurer drives the Text prefix-width
   * tables, so layout, draw, hit-test, selection, drag handles and goal-column
   * all use measured glyph widths. When disabled, the monospace font + grid are
   * restored. A proportional font requires proportional layout (and vice-versa),
   * so the two are switched together here.
   *
   * @param on - enable proportional text
   * @param fontFamily - CSS font-family for proportional mode (e.g. the app font)
   */
  /** Compose the canvas font string from the current size, ratio, and mode. */
  private composeFont(): string {
    const family = this.proportional ? this.proportionalFontFamily : DEFAULT_FONT;
    return `${this.fontSize * this.ratio}px ${family}`;
  }

  /** Line height (device px) scaled with the font size off the LINE_HEIGHT base. */
  private lineHeightForSize(size: number): number {
    return LINE_HEIGHT * (size / DEFAULT_FONT_SIZE) * this.ratio;
  }

  /**
   * Re-derive everything that depends on the font (string, line height, average
   * char width, char budget, viewport rows, measurer) after a font/mode change,
   * preserving the caret through the re-wrap, then redraw. Shared by
   * {@link setProportional}, {@link setFontFamily}, {@link setFontSize}.
   */
  private applyFontChange(redraw = true): void {
    // Capture canonical offsets before the re-wrap; restore the visual caret after.
    this.cursor.reconcileOffsetsFromVisual(this.text);

    this.font = this.composeFont();
    this.lineHeight = this.lineHeightForSize(this.fontSize);
    // Average advance width for the new font (monospace fallback + charsAtLine).
    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");
    // Keep the monospace char budget in step with charWidth so toggling back to
    // monospace re-wraps exactly as before (even after a resize while on).
    this.text.charsAtLine = Math.floor(this.width / this.charWidth);
    // Line height changed → recompute how many rows the viewport fits.
    this.viewport.updateLineEnd(this.viewportFullRowCount() + 1);
    if (this.lines) {
      this.lines.lineHeight = this.lineHeight;
    }
    // Rebuild (or clear) the prefix tables for the new font; recalculates lines.
    this.text.setMeasurer(
      this.proportional ? new CanvasMeasurer(this.ctx, this.font) : undefined,
      this.proportional ? this.width : undefined
    );

    // The re-wrap can shrink the document (the new font wraps to fewer lines);
    // clamp the scroll so a viewport parked near the old end doesn't dangle
    // in empty space past the new last line.
    const maxStart = Math.max(0, this.scrollExtentLineCount() - 1 - this.viewport.noLines);
    if (this.viewport.lineStart > maxStart) {
      this.viewport.lineStart = maxStart;
      this.viewport.scrollOffsetY = 0;
    }

    this.cursor.syncVisualFromOffset(this.text);
    if (redraw) {
      this.draw();
    }
  }

  /**
   * Toggle proportional text. When enabled, the rendered font switches
   * to the proportional family ({@link proportionalFontFamily}, optionally
   * overridden by `fontFamily`) and layout/draw/hit-test/handles/goal-column use
   * measured glyph widths; when disabled, the monospace font + grid are restored.
   * A proportional font requires proportional layout (and vice-versa), so they
   * switch together. The choice is persisted.
   */
  setProportional(on: boolean, fontFamily?: string) {
    this.proportional = on;
    if (fontFamily !== undefined) {
      this.proportionalFontFamily = fontFamily;
    }
    this.applyFontChange();
    this.saveSettings();
  }

  /** Set the proportional font family (applied immediately when proportional). Persisted. */
  setFontFamily(fontFamily: string) {
    this.proportionalFontFamily = fontFamily;
    this.applyFontChange();
    this.saveSettings();
  }

  /** Set the logical font size in CSS px; scales line height. Persisted. */
  setFontSize(px: number) {
    this.fontSize = Math.max(1, px);
    this.applyFontChange();
    this.saveSettings();
  }

  /**
   * Host-supplied font-family options shown in the Options-modal dropdown. When
   * the user hasn't chosen a family yet (still the built-in fallback), default to
   * the first option so the picker shows a valid value matching the host font.
   */
  setFontFamilyOptions(options: { label: string; value: string }[]) {
    this.fontFamilyOptions = options;
    if (options.length > 0 && this.proportionalFontFamily === PROPORTIONAL_FONT) {
      this.proportionalFontFamily = options[0].value;
      // If proportional is already active, the rendered font + measurer were
      // built from the old (fallback) family — rebuild them for the new default.
      if (this.proportional) {
        this.applyFontChange();
      }
    }
  }

  /**
   * The proportional column→pixel resolver to put on DrawingOptions,
   * or undefined when monospace (so draw keeps using `col * charWidth`).
   */
  private drawColumnToPixelX(): ((absLine: number, col: number) => number) | undefined {
    return this.proportional ? (absLine, col) => this.text.columnToPixelX(absLine, col) : undefined;
  }

  /**
   * The proportional pixel→column resolver for mouse hit-testing
   * (device px → caret column on a given line), or undefined when monospace
   * (so the legacy `xToCharI` is used). Mirror of {@link drawColumnToPixelX}.
   */
  private proportionalHitTest(): ((absLine: number, deviceX: number) => number) | undefined {
    return this.proportional
      ? (absLine, deviceX) => this.text.pixelXToColumn(absLine, deviceX)
      : undefined;
  }

  /**
   * Device-px x of a selection-handle boundary point (#3108).
   * Proportional uses measured offsets; monospace keeps `col * charWidth`.
   */
  private handleX(pt: IAbsCoordinates): number {
    return this.proportional
      ? this.text.columnToPixelX(pt.yLine, pt.xLine)
      : pt.xLine * this.charWidth;
  }

  /**
   * Horizontal grab tolerance at a handle (#3108). Proportional scales
   * with the glyph width at the boundary column (so wide glyphs get a wider grab
   * zone), clamped to ≥1px; monospace keeps `charWidth * factor`.
   */
  private handleToleranceX(pt: IAbsCoordinates): number {
    return this.proportional
      ? Math.max(1, this.text.glyphWidthAt(pt.yLine, pt.xLine) * SELECTION_HANDLE_GRAB_CHAR_FACTOR)
      : this.charWidth * SELECTION_HANDLE_GRAB_CHAR_FACTOR;
  }

  /**
   * setCharWidth sets the initial size for characters
   * This is true for monospace font
   * @param txt
   */
  setCharWidth(txt: string) {
    this.ctx.font = this.font;
    const textW = this.ctx.measureText(txt).width;
    this.charWidth = textW / txt.length;
  }

  /**
   * Whole text rows that fit in the backing-store height. The draw loop paints
   * lines `lineStart` … `lineStart + viewport.noLines` (inclusive), i.e. this many rows.
   * Using ceil would pretend a partial bottom row fits, which clips text/line numbers
   * and makes `maxStart` too small so the document’s last line never reaches the bottom.
   */
  private viewportFullRowCount(): number {
    return Math.max(1, Math.floor(this.height / this.lineHeight));
  }

  /**
   * Total line slots for scrolling (content lines + trailing buffer rows).
   * Buffer rows are empty, scrollable, and drawn without line numbers.
   */
  scrollExtentLineCount(): number {
    return this.text.noLines + VIEWPORT_END_BUFFER_ROWS;
  }

  /**
   * Converts mouse/pointer offset Y to canvas buffer Y (same scaling as getCanvasX).
   */
  getCanvasY(offsetY: number): number {
    return offsetY * this.ratio;
  }

  /**
   * Offsets in the same space as MouseEvent.offsetX/Y (CSS px vs layout box).
   * Cursor.xToCharI / setPositionFromCanvasOffsets already apply `ratio` for bitmap mapping.
   */
  private clientCoordsToCanvasOffsets(
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): { ox: number; oy: number } {
    const ox = Math.min(Math.max(clientX, rect.left), rect.right) - rect.left;
    const oy = Math.min(Math.max(clientY, rect.top), rect.bottom) - rect.top;
    return { ox, oy };
  }

  /**
   * Maps pointer position to cursor / selection end using the current viewport.
   */
  private applyPointerToCursor(clientX: number, clientY: number) {
    const rect = this.element.getBoundingClientRect();
    const { ox, oy } = this.clientCoordsToCanvasOffsets(clientX, clientY, rect);
    this.cursor.setPositionFromCanvasOffsets(
      ox,
      oy,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart,
      this.proportionalHitTest()
    );
    this.cursor.yLine = Math.max(
      0,
      Math.min(this.cursor.yLine, Math.max(0, this.text.noLines - 1))
    );
    const segment = this.text.cursorToIndex(this.viewport, this.cursor);
    if (segment) {
      const line = this.text.getLineFromPosition(segment);
      if (line.length < this.cursor.xLine) {
        this.cursor.xLine = line.length;
      }
    }

    // First pointer event starts a (collapsed) selection → set both offsets;
    // subsequent drag events move only head (keep the click anchor fixed).
    const wasSelecting = this.cursor.isSelecting();
    this.cursor.selectArea();
    this.cursor.syncOffsetFromVisual(this.text, wasSelecting);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Issue #3108 — drag the highlight span via start/end handles or by its middle.
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Selection drag handles are only meaningful in HIGHLIGHT mode (where the host
   * uses the selection to anchor entities) and only when there is a real (≥1 char)
   * selection.
   */
  private selectionHandlesActive(): boolean {
    return this.text.mode === EditMode.HIGHLIGHT && this.cursor.isSelected();
  }

  /**
   * The two absolute visual boundary points (document-ordered start, end) where
   * the handles sit, or null when handles should not be shown.
   */
  private selectionHandlePoints(): { start: IAbsCoordinates; end: IAbsCoordinates } | null {
    if (!this.selectionHandlesActive()) {
      return null;
    }
    const [start, end] = this.cursor.getAbsBounds();
    if (!start || !end) {
      return null;
    }
    return { start, end };
  }

  /**
   * Maps client coordinates to an absolute visual position WITHOUT mutating the
   * cursor (unlike applyPointerToCursor). Clamps into the document like a normal
   * click would.
   */
  private pointerToVisual(clientX: number, clientY: number): IAbsCoordinates {
    const rect = this.element.getBoundingClientRect();
    const { ox, oy } = this.clientCoordsToCanvasOffsets(clientX, clientY, rect);
    const tmp = this.scratchCursor;
    tmp.ratio = this.ratio; // ratio can change at runtime (DPR / zoom)
    tmp.setPositionFromCanvasOffsets(
      ox,
      oy,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart,
      this.proportionalHitTest()
    );
    return this.text.clampVisual(tmp.xLine, tmp.yLine);
  }

  /**
   * Hit-test the pointer against the selection handles. Returns the boundary the
   * pointer is grabbing ("start"/"end"), "span" when inside the highlight (move
   * the whole span), or null when neither. Works in canvas backing-store (device)
   * pixels so it lines up with the drawn handles regardless of devicePixelRatio.
   */
  private hitTestSelectionHandle(
    clientX: number,
    clientY: number
  ): "start" | "end" | "span" | null {
    const points = this.selectionHandlePoints();
    if (!points) {
      return null;
    }

    const rect = this.element.getBoundingClientRect();
    const bufX = (clientX - rect.left) * this.ratio;
    const bufY = (clientY - rect.top) * this.ratio;

    const knob = SELECTION_HANDLE_KNOB_RADIUS_PX * this.ratio;

    const boundaries: ["start" | "end", IAbsCoordinates][] = [
      ["start", points.start],
      ["end", points.end],
    ];
    for (const [which, pt] of boundaries) {
      const relLine = pt.yLine - this.viewport.lineStart;
      const cx = this.handleX(pt);
      const tolX = this.handleToleranceX(pt);
      // Screen (untranslated) band for this line: content is drawn translated by
      // -scrollOffsetY, so subtract it here to match the pointer's buffer Y.
      const cyTop = relLine * this.lineHeight - this.viewport.scrollOffsetY;
      const cyBottom = cyTop + this.lineHeight;
      if (
        bufX >= cx - tolX &&
        bufX <= cx + tolX &&
        bufY >= cyTop - knob &&
        bufY <= cyBottom + knob
      ) {
        return which;
      }
    }

    // Not on a handle — is the pointer inside the highlighted span? (move it)
    if (this.isPointerInsideSelection(clientX, clientY)) {
      return "span";
    }
    return null;
  }

  /** True when the pointer maps to a position strictly inside the selection. */
  private isPointerInsideSelection(clientX: number, clientY: number): boolean {
    const points = this.selectionHandlePoints();
    if (!points) {
      return false;
    }
    const startOff = this.text.offsetFromVisual(points.start.xLine, points.start.yLine);
    const endOff = this.text.offsetFromVisual(points.end.xLine, points.end.yLine);
    if (startOff < 0 || endOff < 0) {
      return false;
    }
    const pt = this.pointerToVisual(clientX, clientY);
    const off = this.text.offsetFromVisual(pt.xLine, pt.yLine);
    return off > startOff && off < endOff;
  }

  /**
   * Begin a selection-handle drag (start/end boundary resize, or whole-span move).
   * Bypasses the normal selection path entirely so the existing selection is not
   * collapsed before we move it.
   */
  private startHandleDrag(mode: "start" | "end" | "span", e: MouseEvent): void {
    this.dragHandle = mode;
    this.handleDragMoved = false;
    this.lastSelectPointer = { cx: e.clientX, cy: e.clientY };

    if (mode === "span") {
      const points = this.selectionHandlePoints();
      const pt = this.pointerToVisual(e.clientX, e.clientY);
      const grabOff = this.text.offsetFromVisual(pt.xLine, pt.yLine);
      if (points && grabOff >= 0) {
        const startOff = this.text.offsetFromVisual(points.start.xLine, points.start.yLine);
        const endOff = this.text.offsetFromVisual(points.end.xLine, points.end.yLine);
        this.spanDragState = { startOff, endOff, grabOff };
      } else {
        this.spanDragState = null;
      }
    } else {
      this.spanDragState = null;
    }

    document.addEventListener("mousemove", this.onDocumentHandleMove);
    document.addEventListener("mouseup", this.onDocumentHandleUp);
  }

  /** Apply the current pointer to the in-progress handle drag. */
  private applyHandleDrag(clientX: number, clientY: number): void {
    if (!this.dragHandle) {
      return;
    }
    const pt = this.pointerToVisual(clientX, clientY);

    if (this.dragHandle === "span") {
      if (!this.spanDragState) {
        return;
      }
      const curOff = this.text.offsetFromVisual(pt.xLine, pt.yLine);
      if (curOff < 0) {
        return;
      }
      const { startOff, endOff, grabOff } = this.spanDragState;
      const len = endOff - startOff;
      const maxStart = Math.max(0, this.text.value.length - len);
      let newStart = startOff + (curOff - grabOff);
      newStart = Math.max(0, Math.min(newStart, maxStart));
      this.cursor.setSpanByOffsets(this.text, newStart, newStart + len);
    } else {
      this.cursor.dragBoundary(this.text, this.dragHandle, pt.xLine, pt.yLine);
    }
  }

  /** Finalize a selection-handle drag and tear down its listeners. */
  private endHandleDrag(e: MouseEvent): void {
    if (!this.dragHandle) {
      return;
    }
    const mode = this.dragHandle;
    const moved = this.handleDragMoved;

    // Apply the final pointer BEFORE clearing dragHandle (applyHandleDrag early-
    // returns once dragHandle is null), so a gap between the last move and the
    // release isn't dropped.
    if (moved) {
      this.applyHandleDrag(e.clientX, e.clientY);
    } else if (mode === "span") {
      // A click (no drag) inside the highlight behaves like a normal click:
      // collapse the selection to a caret at that point.
      this.applyPointerToCursor(e.clientX, e.clientY);
      this.cursor.endSelection();
    }
    // A stationary click directly on a boundary handle leaves the selection as-is.

    document.removeEventListener("mousemove", this.onDocumentHandleMove);
    document.removeEventListener("mouseup", this.onDocumentHandleUp);
    this.cancelSelectionEdgeScroll();
    this.lastSelectPointer = null;
    this.dragHandle = null;
    this.spanDragState = null;
    this.handleDragMoved = false;

    this.draw();
  }

  /** Issue #3108 — reflect handle hover with a resize/move cursor. */
  private updateHandleHoverCursor(e: MouseEvent): void {
    if (this.cursor.isSelecting()) {
      // A normal drag-select owns the cursor; don't fight it.
      return;
    }
    let next = "";
    if (this.selectionHandlesActive()) {
      const hit = this.hitTestSelectionHandle(e.clientX, e.clientY);
      if (hit === "start" || hit === "end") {
        next = "ew-resize";
      } else if (hit === "span") {
        next = "move";
      }
    }
    if (this.element.style.cursor !== next) {
      this.element.style.cursor = next;
    }
  }

  /**
   * Issue #3108 — draw the two selection handles (a vertical bar plus a round knob
   * at the start/end boundary) in the same color as the highlight. Called from
   * inside draw()'s translated context, so Y uses viewport-relative line coords
   * (the ctx is already translated by -scrollOffsetY).
   */
  private drawSelectionHandles(): void {
    const points = this.selectionHandlePoints();
    if (!points) {
      return;
    }

    const color = this.cursor.style.color || "black";
    const barW = Math.max(SELECTION_HANDLE_BAR_WIDTH_PX * this.ratio, 1);
    const knob = Math.max(SELECTION_HANDLE_KNOB_RADIUS_PX * this.ratio, 2);
    const maxRelLine = this.viewport.noLines;

    this.ctx.save();
    // SELECT-mode drawLine leaves a non-default composite op / alpha; reset so the
    // handle paints at full opacity in its true color.
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = color;

    const boundaries: ["start" | "end", IAbsCoordinates][] = [
      ["start", points.start],
      ["end", points.end],
    ];
    for (const [which, pt] of boundaries) {
      const relLine = pt.yLine - this.viewport.lineStart;
      if (relLine < 0 || relLine > maxRelLine) {
        // Boundary scrolled out of view — skip so the knob doesn't paint over the
        // gutter or partial rows.
        continue;
      }
      const x = this.handleX(pt);
      const yTop = relLine * this.lineHeight;
      const yBottom = yTop + this.lineHeight;

      this.ctx.fillRect(x - barW / 2, yTop, barW, this.lineHeight);

      // Knob at the top for the start handle, bottom for the end handle — the
      // familiar "pinch" look and avoids the two knobs colliding on short spans.
      const knobY = which === "start" ? yTop : yBottom;
      this.ctx.beginPath();
      this.ctx.arc(x, knobY, knob, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private cancelSelectionEdgeScroll() {
    if (this.selectionScrollRaf) {
      cancelAnimationFrame(this.selectionScrollRaf);
      this.selectionScrollRaf = 0;
    }
  }

  private readonly tickSelectionEdgeScroll = () => {
    this.selectionScrollRaf = 0;
    if ((!this.cursor.isSelecting() && !this.dragHandle) || !this.lastSelectPointer) {
      return;
    }

    const rect = this.element.getBoundingClientRect();
    const cy = this.lastSelectPointer.cy;
    // Only autoscroll when the pointer has left the canvas vertically
    const inTopZone = cy < rect.top;
    const inBottomZone = cy > rect.bottom;
    if (!inTopZone && !inBottomZone) {
      return;
    }

    const lineStartBefore = this.viewport.lineStart;
    const scrollOffBefore = this.viewport.scrollOffsetY;
    const speed = this.lineHeight * SELECTION_EDGE_SCROLL_SPEED;

    if (inTopZone) {
      this.viewport.addScrollOffset(-speed, this.lineHeight, this.scrollExtentLineCount());
    } else if (inBottomZone) {
      this.viewport.addScrollOffset(speed, this.lineHeight, this.scrollExtentLineCount());
    }

    const scrolled =
      this.viewport.lineStart !== lineStartBefore ||
      this.viewport.scrollOffsetY !== scrollOffBefore;

    if (scrolled) {
      if (this.dragHandle) {
        this.handleDragMoved = true;
        this.applyHandleDrag(this.lastSelectPointer.cx, this.lastSelectPointer.cy);
      } else {
        this.applyPointerToCursor(this.lastSelectPointer.cx, this.lastSelectPointer.cy);
      }
      this.draw();
    }

    const inZone = inTopZone || inBottomZone;
    if (
      (this.cursor.isSelecting() || this.dragHandle) &&
      this.lastSelectPointer &&
      inZone &&
      scrolled
    ) {
      this.selectionScrollRaf = requestAnimationFrame(this.tickSelectionEdgeScroll);
    }
  };

  private ensureSelectionEdgeScrollRunning() {
    if (!this.lastSelectPointer || (!this.cursor.isSelecting() && !this.dragHandle)) {
      return;
    }
    if (this.selectionScrollRaf) {
      return;
    }
    const rect = this.element.getBoundingClientRect();
    const cy = this.lastSelectPointer.cy;
    if (cy < rect.top || cy > rect.bottom) {
      this.selectionScrollRaf = requestAnimationFrame(this.tickSelectionEdgeScroll);
    }
  }

  private readonly onDocumentSelectMove = (e: MouseEvent) => {
    if (!this.cursor.isSelecting()) {
      return;
    }
    this.lastSelectPointer = { cx: e.clientX, cy: e.clientY };
    this.applyPointerToCursor(e.clientX, e.clientY);
    this.draw();
    this.ensureSelectionEdgeScrollRunning();
  };

  private endSelectInteraction(e: MouseEvent) {
    document.removeEventListener("mousemove", this.onDocumentSelectMove);
    document.removeEventListener("mouseup", this.onDocumentSelectUp);
    this.cancelSelectionEdgeScroll();
    this.lastSelectPointer = null;
    if (this.cursor.isSelecting()) {
      this.applyPointerToCursor(e.clientX, e.clientY);
      this.cursor.endSelection();
      this.draw();
    }
  }

  private readonly onDocumentSelectUp = (e: MouseEvent) => {
    this.endSelectInteraction(e);
  };

  /**
   * onMouseDown is handler for pressed mouse-key event
   * @param e
   */
  onMouseDown(e: MouseEvent) {
    // Only the primary (left) button drives text selection. A non-primary
    // mousedown — notably the right button, which fires just before the
    // `contextmenu` event — must leave the current selection untouched so the
    // context menu opens over the existing highlight instead of collapsing it
    // (#3092).
    if (e.button !== 0) {
      return;
    }

    // Issue #3108 — if the press lands on a selection handle (or inside the
    // highlight), drag that instead of starting a brand-new selection. Done
    // before applyPointerToCursor, which would otherwise collapse the selection.
    if (this.selectionHandlesActive()) {
      const hit = this.hitTestSelectionHandle(e.clientX, e.clientY);
      if (hit) {
        this.startHandleDrag(hit, e);
        return;
      }
    }

    this.caretBlink.reset(); // solid caret immediately on click (#3092)
    this.lastSelectPointer = { cx: e.clientX, cy: e.clientY };
    this.applyPointerToCursor(e.clientX, e.clientY);

    this.annotatedPosition = this.text.cursorToIndex(this.viewport, this.cursor);

    this.draw();

    document.addEventListener("mousemove", this.onDocumentSelectMove);
    document.addEventListener("mouseup", this.onDocumentSelectUp);
    this.ensureSelectionEdgeScrollRunning();
  }

  /**
   * onMouseUp is handler for released mouse-key event
   * @param e
   */
  onMouseUp(e: MouseEvent) {
    this.endSelectInteraction(e);
  }

  /** Whether the blinking caret is currently in its visible phase (#3092). */
  isCaretVisible(): boolean {
    return this.caretBlink.isVisible();
  }

  /**
   * Force the caret solid and restart its blink phase. Called on user activity
   * (clicks, keystrokes) so the caret never lands mid-"off" right as it moves.
   */
  resetCaretBlink(): void {
    this.caretBlink.reset();
  }

  /**
   * Tear down timers and document-level listeners. Hosts must call this when the
   * annotator is unmounted, otherwise the caret-blink interval keeps repainting
   * a detached canvas (#3092).
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    if (canvasHosts.get(this.element) === this) {
      canvasHosts.delete(this.element);
    }
    if (this.scroller && scrollerHosts.get(this.scroller.element) === this) {
      scrollerHosts.delete(this.scroller.element);
    }
    if (this.lines && linesHosts.get(this.lines.element) === this) {
      linesHosts.delete(this.lines.element);
    }

    this.caretBlink.destroy();
    this.resizePulse.destroy();
    if (this.deferredInitTimeout !== undefined) {
      clearTimeout(this.deferredInitTimeout);
      this.deferredInitTimeout = undefined;
    }
    this.cancelSelectionEdgeScroll();
    if (this.hoverDebounceTimeout) {
      clearTimeout(this.hoverDebounceTimeout);
      this.hoverDebounceTimeout = undefined;
    }
    document.removeEventListener("mousemove", this.onDocumentSelectMove);
    document.removeEventListener("mouseup", this.onDocumentSelectUp);

    this.element.onwheel = null;
    this.element.onmousedown = null;
    this.element.onkeydown = null;
    this.element.removeEventListener("dblclick", this.boundOnMouseDoubleClick);
    this.element.removeEventListener("mousemove", this.boundOnMouseMove);
    this.element.removeEventListener("mouseleave", this.boundOnCanvasMouseLeave);
    this.element.removeEventListener("contextmenu", this.boundOnContextMenu);
    this.element.removeEventListener("focus", this.boundOnCanvasFocus);
    this.element.removeEventListener("blur", this.boundOnCanvasBlur);

    this.onScrollCb = undefined;
    this.scroller = undefined;
    this.lines = undefined;
  }

  /**
   * onMouseMove is handler for moving mouse-event
   * @param e
   */
  onMouseMove(e: MouseEvent) {
    if (this.cursor.isSelecting()) {
      this.onDocumentSelectMove(e);
    }

    // Issue #3108 — resize/move cursor feedback over selection handles. Done
    // synchronously (not in the hover debounce below) so it never feels laggy.
    if (!this.dragHandle) {
      this.updateHandleHoverCursor(e);
    }

    // Part 2 of #2835: Detect anchors at hover position
    if (
      (this.onAnchorHoverCb || this.onAnchorTagHoverCb) &&
      !this.cursor.isSelecting() &&
      !this.dragHandle
    ) {
      // Clear existing debounce timeout
      if (this.hoverDebounceTimeout) {
        clearTimeout(this.hoverDebounceTimeout);
      }

      // Debounce the hover detection
      this.hoverDebounceTimeout = setTimeout(() => {
        this.detectAndEmitAnchorHover(e);
        this.detectAndEmitAnchorTagHover(e);
      }, HOVER_DEBOUNCE_MS);
    }
  }

  onMouseDoubleClick(e: MouseEvent) {
    this.caretBlink.reset(); // solid caret immediately on double-click (#3092)
    this.cursor.setPositionFromEvent(
      e,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart,
      this.proportionalHitTest()
    );
    this.cursor.yLine = Math.max(
      0,
      Math.min(this.cursor.yLine, Math.max(0, this.text.noLines - 1))
    );
    const segment = this.text.cursorToIndex(this.viewport, this.cursor);
    if (segment) {
      const line = this.text.getLineFromPosition(segment);
      if (line.length < this.cursor.xLine) {
        this.cursor.xLine = line.length;
      }
    }

    const [offsetLeft, offsetRight] = this.text.getCursorWordOffsets(this.viewport, this.cursor);
    this.cursor.selectStart = {
      xLine: this.cursor.xLine + offsetLeft,
      yLine: this.cursor.yLine,
    };
    this.cursor.selectEnd = {
      xLine: this.cursor.xLine + offsetRight,
      yLine: this.cursor.yLine,
    };
    this.cursor.xLine = this.cursor.selectEnd.xLine;
    this.cursor.selectDirection = DIRECTION.FORWARD;
    // Canonical offsets: anchor = word start, head = word end (caret).
    this.cursor.anchor = this.text.offsetFromVisual(
      this.cursor.selectStart.xLine,
      this.cursor.selectStart.yLine
    );
    this.cursor.head = this.text.offsetFromVisual(
      this.cursor.selectEnd.xLine,
      this.cursor.selectEnd.yLine
    );
    this.draw();
  }

  /**
   * onContextMenu opens the right-click context menu at the pointer.
   * @param e
   */
  onContextMenu(e: MouseEvent) {
    e.preventDefault();
    this.contextMenu.open(e.clientX, e.clientY, this.buildContextMenuItems());
  }

  /** Whether a non-empty text highlight/selection is active. */
  isHighlighting(): boolean {
    return this.cursor.isSelected();
  }

  /** Context-menu entries. For now just a toggle for the debug FPS counter. */
  private buildContextMenuItems(): ContextMenuItem[] {
    const items: ContextMenuItem[] = [];

    if (this.isHighlighting()) {
      items.push({
        label: "Copy",
        onClick: () => this.onCopyText(),
      });
    }

    items.push({
      label: "Paste",
      onClick: () => this.onPasteText(),
    });

    items.push({ separator: true });
    items.push(
      {
        label: `${this.showFps ? "✓ " : ""}Show FPS counter`,
        onClick: () => this.setShowFps(!this.showFps),
      },
      { separator: true },
      { label: "Options…", onClick: () => this.openSettings() }
    );

    return items;
  }

  /** Open the settings overlay with the current options. */
  private openSettings(): void {
    const settings: SettingControl[] = [
      {
        type: "segmented",
        label: "Cursor size",
        options: [
          { label: "1px", value: 1 },
          { label: "2px", value: 2 },
          { label: "3px", value: 3 },
        ],
        value: this.caretWidth,
        onChange: (px) => this.setCaretWidth(px),
      },
      {
        type: "color",
        label: "Highlight color",
        value: this.getHighlightColor(),
        onChange: (hex) => this.setHighlightColor(hex),
      },
      {
        type: "segmented",
        label: "Font",
        options: [
          { label: "Proportional", value: 1 },
          { label: "Monospace", value: 0 },
        ],
        value: this.proportional ? 1 : 0,
        onChange: (v) => {
          this.setProportional(v === 1);
          this.openSettings(); // re-render so the family picker enables/disables
        },
      },
    ];

    // Family picker only when the host supplied options (it's the proportional
    // typeface; monospace always uses the built-in monospace font, so the picker
    // is disabled until proportional is selected).
    if (this.fontFamilyOptions.length > 0) {
      settings.push({
        type: "select",
        label: "Font family",
        options: this.fontFamilyOptions,
        value: this.proportionalFontFamily,
        onChange: (family) => this.setFontFamily(family),
        disabled: !this.proportional,
      });
    }

    settings.push({
      type: "segmented",
      label: "Font size",
      options: [
        { label: "11", value: 11 },
        { label: "12", value: 12 },
        { label: "13", value: 13 },
        { label: "14", value: 14 },
        { label: "15", value: 15 },
      ],
      value: this.fontSize,
      onChange: (px) => this.setFontSize(px),
    });

    this.settingsOverlay.open(
      settings,
      this.element,
      [
        {
          label: "Reset to defaults",
          variant: "secondary",
          onClick: () => {
            this.resetSettings();
            this.openSettings(); // re-render so controls show the defaults
          },
        },
        {
          // Primary fill = the same accent the active segmented buttons use.
          label: "Done",
          variant: "primary",
          onClick: () => this.settingsOverlay.close(),
        },
      ],
      this.menuColors
    );
  }

  /**
   * onWheel is handler for mouse-wheel-event. Uses fluent scroll: accumulates deltaY
   * so text and line numbers scroll smoothly together.
   * @param e
   */
  onWheel(e: WheelEvent) {
    const deltaBufferPx = e.deltaY * this.ratio;
    this.viewport.addScrollOffset(deltaBufferPx, this.lineHeight, this.scrollExtentLineCount());

    e.preventDefault();
    this.draw();
  }

  addLines(canvasElement: HTMLCanvasElement): void {
    const prev = linesHosts.get(canvasElement);
    if (prev && prev !== this) {
      prev.destroy();
    }
    this.lines = new Lines(canvasElement, this.ratio, this.lineHeight, this.charWidth);
    linesHosts.set(canvasElement, this);
  }

  getAnnotations(start: SegmentPosition | null, end: SegmentPosition | null): Tag[] {
    // Track open/close tag pairs more cleanly using Tag objects
    const tagStack: Tag[] = [];
    const finalTags: Tag[] = [];
    const processedTags = new Set<string>(); // Track processed tag instances by position
    const tagPairs = new Map<string, { opening?: Tag; closing?: Tag }>(); // Track tag pairs
    const closingToOpeningMap = new Map<Tag, Tag>(); // Map each closing tag to its matched opening tag

    // sanitize case without start
    if (!start) {
      start = {
        charInLineIndex: 0,
        lineIndex: 0,
        parsedTextIndex: 0,
        rawTextIndex: 0,
        segmentIndex: 0,
      };
    }
    // sanitize case without end
    if (!end) {
      end = start;
    }

    // Helper function to calculate absolute text index from tag position and segment index
    const getAbsoluteTextIndex = (tag: Tag): number => {
      let absoluteIndex = tag.position;
      // Add lengths of all previous segments
      for (let i = 0; i < tag.segmentIndex; i++) {
        absoluteIndex += this.text.segments[i].raw.length + 1; // +1 for newline between segments
      }
      return absoluteIndex;
    };

    // Helper function to create a unique identifier for a tag
    const getTagId = (tag: Tag): string => {
      return `${tag.segmentIndex}-${tag.position}-${tag.getTagName()}-${
        tag.closing ? "close" : "open"
      }`;
    };

    // Helper function to find the closest opening tag for a given tag name
    const findClosestOpeningTag = (tagName: string, beforeAbsolutePosition: number): Tag | null => {
      let closestTag: Tag | null = null;
      let closestDistance = Infinity;

      for (let i = 0; i <= end!.segmentIndex; i++) {
        const segment = this.text.segments[i];
        for (const tag of segment.openingTags) {
          const tagAbsolutePosition = getAbsoluteTextIndex(tag);
          if (tag.getTagName() === tagName && tagAbsolutePosition < beforeAbsolutePosition) {
            const distance = beforeAbsolutePosition - tagAbsolutePosition;
            if (distance < closestDistance) {
              closestDistance = distance;
              closestTag = tag;
            }
          }
        }
      }

      return closestTag;
    };

    // Helper function to add tag to final list if not already processed
    const addToFinal = (tag: Tag) => {
      const tagId = getTagId(tag);
      if (!processedTags.has(tagId)) {
        finalTags.push(tag);
        processedTags.add(tagId);
      }
    };

    // Process all segments from beginning to end position
    for (let i = 0; i <= end.segmentIndex; i++) {
      const segment = this.text.segments[i];

      const allTags = segment.openingTags
        .concat(segment.closingTags)
        .sort((a, b) => a.position - b.position);

      for (const tag of allTags) {
        if (!tag.closing) {
          tagStack.push(tag);

          if (!tagPairs.has(tag.getTagName())) {
            tagPairs.set(tag.getTagName(), {});
          }
          tagPairs.get(tag.getTagName())!.opening = tag;

          const tagInSelection =
            i > start.segmentIndex ||
            (i === start.segmentIndex &&
              tag.position >= start.rawTextIndex &&
              (i < end.segmentIndex ||
                (i === end.segmentIndex && tag.position < end.rawTextIndex)));
          if (tagInSelection) {
            addToFinal(tag);
          }
        } else {
          const matchingIndex = tagStack.findLastIndex(
            (stackTag) => stackTag.getTagName() === tag.getTagName() && !stackTag.closing
          );

          if (matchingIndex !== -1) {
            const matchedOpeningTag = tagStack[matchingIndex];
            closingToOpeningMap.set(tag, matchedOpeningTag);
            tagStack.splice(matchingIndex, 1);

            const closingTagInSelection =
              (i > start.segmentIndex ||
                (i === start.segmentIndex && tag.position >= start.rawTextIndex)) &&
              (i < end.segmentIndex || (i === end.segmentIndex && tag.position < end.rawTextIndex));

            const openingTagOpenedBeforeEnd =
              matchedOpeningTag.segmentIndex < end.segmentIndex ||
              (matchedOpeningTag.segmentIndex === end.segmentIndex &&
                matchedOpeningTag.position < end.rawTextIndex);

            const shouldIncludeOpeningTag =
              closingTagInSelection ||
              (openingTagOpenedBeforeEnd &&
                (i > start.segmentIndex ||
                  (i === start.segmentIndex && tag.position >= start.rawTextIndex)));

            if (shouldIncludeOpeningTag) {
              addToFinal(matchedOpeningTag);
            }
          }

          if (!tagPairs.has(tag.getTagName())) {
            tagPairs.set(tag.getTagName(), {});
          }
          tagPairs.get(tag.getTagName())!.closing = tag;

          const closingTagInSelection =
            (i > start.segmentIndex ||
              (i === start.segmentIndex && tag.position >= start.rawTextIndex)) &&
            (i < end.segmentIndex || (i === end.segmentIndex && tag.position < end.rawTextIndex));
          if (closingTagInSelection) {
            addToFinal(tag);
          }
        }
      }
    }
    // Add any remaining unclosed tags from the stack
    // These are tags that opened before or within the selection and are still open at the end
    // Only include tags that opened before the end position (tags after end are not in selection)
    for (const unclosedTag of tagStack) {
      // Check if the tag opened before the end position
      // Tags that opened after end position should not be included
      const tagOpenedBeforeEnd =
        unclosedTag.segmentIndex < end.segmentIndex ||
        (unclosedTag.segmentIndex === end.segmentIndex && unclosedTag.position < end.rawTextIndex);

      if (tagOpenedBeforeEnd) {
        // Tag opened before end position and is still unclosed, so it's active in the selection
        addToFinal(unclosedTag);
      }
    }

    // Post-process to remove closing tags and replace orphaned closing tags
    const processedFinalTags: Tag[] = [];
    const processedTagIds = new Set<string>(); // Track processed tags by their unique IDs

    for (const tag of finalTags) {
      if (!tag.closing) {
        // Opening tag - add it if not already processed
        const tagId = getTagId(tag);
        if (!processedTagIds.has(tagId)) {
          processedFinalTags.push(tag);
          processedTagIds.add(tagId);
        }
      } else {
        // Closing tag - find its matched opening tag
        const matchedOpeningTag = closingToOpeningMap.get(tag);

        if (matchedOpeningTag) {
          // We have a recorded pairing - add the opening tag if not already processed
          const openingTagId = getTagId(matchedOpeningTag);
          if (!processedTagIds.has(openingTagId)) {
            processedFinalTags.push(matchedOpeningTag);
            processedTagIds.add(openingTagId);
          }
          // Skip the closing tag itself (we only want opening tags in the result)
        } else {
          // Orphaned closing tag (no recorded pairing) - find closest opening tag and use it instead
          const tagSegmentIndex = tag.segmentIndex;
          if (tagSegmentIndex !== -1) {
            const tagAbsolutePosition = getAbsoluteTextIndex(tag);
            const closestOpening = findClosestOpeningTag(tag.getTagName(), tagAbsolutePosition);
            if (closestOpening) {
              const closestOpeningId = getTagId(closestOpening);
              if (!processedTagIds.has(closestOpeningId)) {
                processedFinalTags.push(closestOpening);
                processedTagIds.add(closestOpeningId);
              }
            }
          }
          // If no opening tag found, skip this closing tag entirely
        }
      }
    }

    // Order the anchors "from inside outwards" (issue #2051): the innermost /
    // most specific anchor (e.g. a Location on a single word) should come first,
    // then the enclosing anchors (its Statement, the Territory the Statement is
    // in, its parent Territory, ...). Anchors that do not nest but sit next to
    // each other (parallel / same-level) keep their order of appearance.
    //
    // We achieve both by sorting on the position where each anchor *closes*
    // rather than where it opens: a nested anchor always closes before the one
    // enclosing it, while parallel anchors close in their order of appearance.
    const openingToClosing = new Map<Tag, Tag>();
    for (const [closingTag, openingTag] of closingToOpeningMap) {
      openingToClosing.set(openingTag, closingTag);
    }

    const getOpenAbsolutePosition = (tag: Tag): number =>
      tag.segmentIndex !== -1 ? getAbsoluteTextIndex(tag) : tag.position;

    const getCloseAbsolutePosition = (openingTag: Tag): number => {
      const closingTag = openingToClosing.get(openingTag);
      // The scan only visits segments up to `end.segmentIndex`, so anchors that
      // close in a later segment are never paired here. Those are exactly the
      // anchors that stay open past the selection — the enclosing containers —
      // so they sort last (their internal order is handled by the tie-break).
      if (!closingTag) {
        return Number.POSITIVE_INFINITY;
      }
      return getAbsoluteTextIndex(closingTag);
    };

    return processedFinalTags.sort((a, b) => {
      const aClose = getCloseAbsolutePosition(a);
      const bClose = getCloseAbsolutePosition(b);
      if (aClose !== bClose) {
        return aClose - bClose;
      }
      // Same closing position. Anchors that stay open past the selection (their
      // closing tag was never scanned) are enclosing containers that form a
      // proper nesting chain — the one that opened *later* is nested more deeply
      // and must come first (inside -> outside).
      if (aClose === Number.POSITIVE_INFINITY) {
        return getOpenAbsolutePosition(b) - getOpenAbsolutePosition(a);
      }
      // Genuine equal closing position (e.g. broken / asymmetrical anchors):
      // keep them in order of appearance.
      return getOpenAbsolutePosition(a) - getOpenAbsolutePosition(b);
    });
  }

  /**
   * addScroller adds optional Scroller component to stack
   * @param e
   */
  addScroller(scrollerDiv: HTMLDivElement) {
    const prev = scrollerHosts.get(scrollerDiv);
    if (prev && prev !== this) {
      prev.destroy();
    }
    this.scroller = new Scroller(scrollerDiv);
    this.scroller.setFocusTarget(this.element);
    this.scroller.onChange((percentage: number) => {
      const viewportLines = this.viewport.lineEnd - this.viewport.lineStart;
      const scrollableLines = Math.max(0, this.scrollExtentLineCount() - viewportLines);
      const scrollablePx = scrollableLines * this.lineHeight;
      const targetPx = (percentage / 100) * scrollablePx;
      const targetLineFrac = scrollablePx > 0 ? targetPx / this.lineHeight : 0;

      this.viewport.setScrollPosition(
        targetLineFrac,
        0,
        this.lineHeight,
        this.scrollExtentLineCount()
      );
      this.draw();
    });
    this.scroller?.setRunnerSize((this.viewport.noLines / this.scrollExtentLineCount()) * 100);

    const viewportSize = this.viewport.noLines / this.scrollExtentLineCount();
    this.scroller?.setViewportSize(Math.min(100, viewportSize * 100));
    scrollerHosts.set(scrollerDiv, this);
  }

  /**
   * Line gutter must share the main canvas backing-store height (and horizontal scale).
   * Using `height * RATIO` from React alone can differ from `style.height * ratio` on the
   * main canvas → 1× vs 2× mismatch → line numbers look huge and rows don't align.
   */
  private syncLineNumbersCanvasToMain(): void {
    if (!this.lines) return;
    const mainEl = this.element;
    const lineEl = this.lines.element;

    const parseCssPx = (v: string | undefined): number => {
      if (!v) return 0;
      const n = Number(
        String(v)
          .replace(/px\s*$/i, "")
          .trim()
      );
      return Number.isFinite(n) ? n : 0;
    };

    const mainCssW = parseCssPx(mainEl.style.width) || mainEl.clientWidth || 1;
    const gutterCssW = parseCssPx(lineEl.style.width) || lineEl.clientWidth || 50;

    if (mainEl.style.height) {
      lineEl.style.height = mainEl.style.height;
    }

    const scale = mainEl.width > 0 && mainCssW > 0 ? mainEl.width / mainCssW : this.ratio;
    const nextW = Math.max(1, Math.round(gutterCssW * scale));
    const nextH =
      mainEl.height > 0
        ? mainEl.height
        : Math.max(
            1,
            Math.round((parseCssPx(mainEl.style.height) || mainEl.clientHeight) * this.ratio)
          );

    if (lineEl.width !== nextW || lineEl.height !== nextH) {
      lineEl.width = nextW;
      lineEl.height = nextH;
    }
  }

  /**
   * Issue #2887 — draw corner markers at the ends of ANCHOR-mode highlights
   * (Territory anchors). Each item contributes a start (┌) and an end (└)
   * marker; a filled span is never drawn, so the whole-territory anchor does
   * not flood the fulltext. Markers sharing an exact position are stacked with
   * a small horizontal offset (e.g. a book and its first chapter starting on
   * the same character), preserving the innermost-first order the highlight
   * list already carries (#2051). Assumes the ctx is translated for scroll,
   * matching the surrounding draw passes.
   */
  private drawAnchorMarkers(
    higlightItems: {
      schema: HighlightSchema;
      start: IAbsCoordinates;
      end: IAbsCoordinates;
      tag?: Tag;
    }[]
  ): void {
    const anchorItems = higlightItems.filter((it) => it.schema.mode === HighlightMode.ANCHOR);
    if (anchorItems.length === 0) {
      return;
    }
    // Note: this.anchorMarkerHitboxes is cleared once per frame at the top of
    // draw() (so it empties even in RAW/SEMI where this method never runs); we
    // only append here.

    const armH = ANCHOR_MARKER_ARM_H_RATIO * this.lineHeight;
    const armW = ANCHOR_MARKER_ARM_W_RATIO * this.charWidth;
    const lineWidth = ANCHOR_MARKER_LINE_WIDTH_PX * this.ratio;
    const stackStep = ANCHOR_MARKER_STACK_STEP_PX * this.ratio;

    const columnToPixelX = this.drawColumnToPixelX();
    const toPx = (yLine: number, xLine: number): number =>
      columnToPixelX ? columnToPixelX(yLine, xLine) : xLine * this.charWidth;

    // Only rows the main text renderer paints are eligible; a marker whose
    // endpoint is off-screen is simply skipped (a multi-screen territory shows
    // ┌ on its first visible line and ┘ on its last).
    const lastVisibleRel =
      Math.min(this.viewport.lineEnd, this.text.noLines) - this.viewport.lineStart;

    // Expand each anchor into its two endpoint markers, in list order.
    const points: {
      yLine: number;
      xLine: number;
      kind: "start" | "end";
      color: string;
      tag?: Tag;
    }[] = [];
    for (const it of anchorItems) {
      points.push({
        yLine: it.start.yLine,
        xLine: it.start.xLine,
        kind: "start",
        color: it.schema.style.color,
        tag: it.tag,
      });
      // An end boundary at column 0 belongs visually to the previous line —
      // drawn on its own line, the ┘ arm (running left) would be clamped
      // rightward over that line's text. Render it after the previous line's
      // last character instead.
      let endYLine = it.end.yLine;
      let endXLine = it.end.xLine;
      if (endXLine === 0 && endYLine > 0) {
        endYLine -= 1;
        endXLine = this.text.getLine(endYLine).length;
      }
      points.push({
        yLine: endYLine,
        xLine: endXLine,
        kind: "end",
        color: it.schema.style.color,
        tag: it.tag,
      });
    }

    // Offset successive markers that land on the exact same position/side so
    // stacked anchors remain individually visible instead of overprinting.
    const stackIndex = new Map<string, number>();
    for (const p of points) {
      const relLine = p.yLine - this.viewport.lineStart;
      if (relLine < 0 || relLine > lastVisibleRel) {
        continue;
      }

      const key = `${p.yLine}:${p.xLine}:${p.kind}`;
      const idx = stackIndex.get(key) ?? 0;
      stackIndex.set(key, idx + 1);

      // Stacked markers fan out to the right (both arms point right), so a
      // stack never runs off the left margin where boundaries commonly sit.
      const xPx = toPx(p.yLine, p.xLine) + idx * stackStep;
      const yMid = (relLine + 0.5) * this.lineHeight;

      // #2885 — the anchor being resized pulses its corner markers too (not just
      // the span wash), so a Territory (whose only visual is these markers) shows
      // which boundary is being moved. Oscillate the marker opacity between
      // PULSE_MARKER_MIN and full via the shared ResizePulse phase, never fully
      // hidden so it stays locatable.
      const pulsing =
        this.resizeAnchor != null && p.tag?.getTagName() === this.resizeAnchor.tagName;
      const PULSE_MARKER_MIN = 0.3;
      const markerOpacity = pulsing
        ? PULSE_MARKER_MIN + (1 - PULSE_MARKER_MIN) * this.resizePulse.intensity()
        : 1;

      const box = drawAnchorMarker(this.ctx, xPx, yMid, p.kind, {
        armH,
        armW,
        lineWidth,
        color: p.color,
        opacity: markerOpacity,
      });

      // Record a padded hit target around the box actually drawn — start and
      // end glyphs sit on opposite sides of the boundary, so the drawer reports
      // its own bounds. Coordinates match the draw space;
      // detectAndEmitAnchorTagHover converts the pointer to match.
      if (p.tag) {
        const pad = ANCHOR_MARKER_HIT_PAD_PX * this.ratio;
        this.anchorMarkerHitboxes.push({
          x: box.x - pad,
          y: box.y - pad,
          w: box.w + 2 * pad,
          h: box.h + 2 * pad,
          tag: p.tag,
        });
      }
    }
  }

  /**
   * #2887 — is the pointer over a Territory anchor marker drawn this frame?
   * Returns the marker's Tag, or null. Pointer offsets (CSS px, canvas-local)
   * are converted to the marker draw space: ×ratio for device px, and +scroll
   * offset on Y to undo the draw-time `translate(0, -scrollOffsetY)`. Markers
   * are only populated during a HIGHLIGHT-mode draw, so this is inert (empty
   * list) in RAW/SEMI without any explicit mode check.
   */
  private hitTestAnchorMarker(e: MouseEvent): Tag | null {
    if (this.anchorMarkerHitboxes.length === 0) {
      return null;
    }
    const mx = e.offsetX * this.ratio;
    const my = e.offsetY * this.ratio + this.viewport.scrollOffsetY;
    for (const hb of this.anchorMarkerHitboxes) {
      if (mx >= hb.x && mx <= hb.x + hb.w && my >= hb.y && my <= hb.y + hb.h) {
        return hb.tag;
      }
    }
    return null;
  }

  /**
   * draw resets the canvas and redraws the scene anew.
   * First draw lines with text, then allow each component to draw their own logic.
   * TODO - this should be done in conjunction with requestAnimationFrame
   */
  draw() {
    if (this.destroyed) {
      return;
    }
    if (this.showFps) {
      this.updateFps();
    }

    // #2887 — clear last frame's marker hover targets; the HIGHLIGHT draw below
    // repopulates them. Cleared unconditionally so RAW/SEMI frames leave none.
    this.anchorMarkerHitboxes = [];

    this.syncLineNumbersCanvasToMain();

    this.ctx.reset();

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(0, -this.viewport.scrollOffsetY);

    this.ctx.font = this.font;
    this.ctx.fillStyle = this.fontColor;
    this.ctx.textBaseline = "middle";

    const textToRender = this.text.getViewportText(this.viewport);
    const renderEndCond = this.viewport.lineEnd - this.viewport.lineStart;
    for (let renderLine = 0; renderLine <= renderEndCond; renderLine++) {
      const textLine = textToRender[renderLine];
      if (textLine) {
        this.ctx.fillText(textLine, 0, (renderLine + 0.5) * this.lineHeight);
      }
    }

    const textSegment = this.text.cursorToIndex(this.viewport, this.cursor);

    // Blink only while a collapsed caret is shown and the canvas is focused.
    this.caretBlink.sync(this.cursor.hasCaret() && this.canvasFocused);

    if (textSegment && !this.selectionHidden) {
      const line = this.text.getLineFromPosition(textSegment);
      if (this.cursor.xLine > line.length) {
        // Offset-model navigation/editing keeps the caret in bounds; this is a
        // defensive clamp for a caret set visually (setPosition) without a sync,
        // replacing the legacy fixOutOfBounds line-flow repair.
        this.cursor.xLine = line.length;
      }

      this.cursor.draw(this.ctx, this.viewport, this.text, {
        lineHeight: this.lineHeight,
        charWidth: this.charWidth,
        charsAtLine: this.text.charsAtLine,
        caretWidth: this.caretWidth * this.ratio,
        caretVisible: this.canvasFocused && this.caretBlink.isVisible(),
        columnToPixelX: this.drawColumnToPixelX(),
      });
    }

    // Draw hover highlights for statement list interaction (#2835). Each anchor
    // occurrence is drawn as its own region so multiple anchors of the same
    // statement are not connected into one continuous span (#3017). The single
    // hoverHighlighter is reused so its configured style is preserved.
    for (const region of this.hoverRegions) {
      this.hoverHighlighter.selectStart = region.start;
      this.hoverHighlighter.selectEnd = region.end;
      this.hoverHighlighter.draw(this.ctx, this.viewport, this.text, {
        lineHeight: this.lineHeight,
        charWidth: this.charWidth,
        charsAtLine: this.text.charsAtLine,
        columnToPixelX: this.drawColumnToPixelX(),
      });
    }
    // Clear the per-region bounds so the highlighter isn't left holding the last
    // region's selectStart/selectEnd between draws (style is preserved). reset()
    // only nulls the bounds, not the configured style.
    this.hoverHighlighter.reset();

    // if (this.onSelectTextCb && this.cursor.isSelected()) {
    // While resizing an anchor the selection is frozen and hidden — don't report
    // it, so the host's selection state (and the open menu) stay put (#2885).
    if (this.onSelectTextCb && !this.selectionHidden) {
      const [start, end] = this.cursor.getAbsBounds();
      if (start && end && (start.xLine !== end.xLine || start?.yLine !== end?.yLine)) {
        const startSegment = this.text.getSegmentPosition(
          start.yLine,
          start.xLine
        ) as SegmentPosition;
        const endSegment = this.text.getSegmentPosition(end.yLine, end.xLine) as SegmentPosition;
        const annotated = this.getAnnotations(startSegment, endSegment);
        this.onSelectTextCb({
          text: this.text.getRangeText(start, end),
          anchors: annotated,
          index: this.text.getAbsTextIndexFromPosition(
            this.text.getSegmentPosition(start.yLine, start.xLine)
          ),
        });
      } else {
        this.onSelectTextCb({
          text: "",
          anchors: [],
          index: -1,
        });
      }
    }

    if (this.text.mode === EditMode.HIGHLIGHT && this.onHighlightCb) {
      const startPos = this.text.getSegmentPosition(this.viewport.lineStart, 0, true);
      const endPos = this.text.getSegmentPosition(this.viewport.lineEnd, this.text.charsAtLine);

      const annotated: Tag[] = this.getAnnotations(startPos, endPos);
      const higlightItems: {
        schema: HighlightSchema;
        start: IAbsCoordinates;
        end: IAbsCoordinates;
        tag?: Tag; // #2887 — carried so ANCHOR markers know their entity for hover
      }[] = [];
      const processedTagNames = new Set<string>();
      for (const tag of annotated) {
        const tagName = tag.getTagName();
        if (processedTagNames.has(tagName)) {
          continue;
        }
        processedTagNames.add(tagName);
        const hlResult = this.onHighlightCb(tagName);
        let schemas = Array.isArray(hlResult) ? hlResult : hlResult ? [hlResult] : [];
        // The anchor being resized is drawn separately as an animated pulse
        // (below), so drop its fill/underline schemas to avoid double-painting.
        // Its ANCHOR corner markers are kept: for Territory anchors they are
        // the only visual, and hiding them makes the anchor look deleted (#2887).
        if (this.resizeAnchor && this.resizeAnchor.tagName === tagName) {
          schemas = schemas.filter((s) => s.mode === HighlightMode.ANCHOR);
        }
        if (schemas.length) {
          let occurence: IAbsCoordinates[];
          let i = 0;
          do {
            occurence = this.text.getTagPosition(tagName, i);
            if (occurence.length > 1) {
              for (const schema of schemas) {
                higlightItems.push({
                  schema,
                  start: occurence[0],
                  end: occurence[1],
                  tag,
                });
              }
            }
            i++;
          } while (!!occurence.length);
        }
      }

      // the focus mode goes to the end, underline mode goes to start
      higlightItems.sort((a, b) => {
        if (a.schema.mode === "focus") {
          return 1;
        }
        if (a.schema.mode === "underline") {
          return -1;
        }
        return 0;
      });

      for (const item of higlightItems) {
        // ANCHOR items are point markers, not spans — drawn in the dedicated
        // pass below (#2887), never as a filled range.
        if (item.schema.mode === HighlightMode.ANCHOR) {
          continue;
        }
        const highlighter = new Highlighter(
          this.ratio,
          {
            color: item.schema.style.color,
            opacity: item.schema.style.opacity,
          },
          item.schema.mode
        );

        highlighter.selectStart = item.start;
        highlighter.selectEnd = item.end;
        highlighter.draw(this.ctx, this.viewport, this.text, {
          lineHeight: this.lineHeight,
          charWidth: this.charWidth,
          charsAtLine: this.text.charsAtLine,
          columnToPixelX: this.drawColumnToPixelX(),
        });
      }

      // #2885 — pulse overlay for the anchor being resized: its own class colour
      // with opacity oscillating via the ResizePulse phase, so it reads as a
      // living accent while the ordinary blue selection is hidden.
      if (this.resizeAnchor) {
        const span = this.getAnchorSpanCoords(
          this.resizeAnchor.tagName,
          this.resizeAnchor.openTagRef
        );
        const pulseSchemas = this.getResizePulseSchemas(this.resizeAnchor.tagName);
        if (span && pulseSchemas.length) {
          const baseOpacity = 0.5;
          // Pulse both below AND above the entity's normal highlight opacity —
          // the midpoint of the cycle (intensity 0.5) matches the static look,
          // dimmer at the "down" phase, stronger at the "up" phase.
          const PULSE_AMPLITUDE = 0.47;
          const opacity = Math.max(
            0,
            Math.min(
              1,
              baseOpacity *
                (1 - PULSE_AMPLITUDE + 2 * PULSE_AMPLITUDE * this.resizePulse.intensity())
            )
          );
          for (const schema of pulseSchemas) {
            const pulse = new Highlighter(
              this.ratio,
              { color: schema.style.color, opacity },
              schema.mode
            );
            pulse.selectStart = span.start;
            pulse.selectEnd = span.end;
            pulse.draw(this.ctx, this.viewport, this.text, {
              lineHeight: this.lineHeight,
              charWidth: this.charWidth,
              charsAtLine: this.text.charsAtLine,
              columnToPixelX: this.drawColumnToPixelX(),
            });
          }
        }
      }

      this.drawAnchorMarkers(higlightItems);

      // #2887 — highlights and anchor markers paint after the collapsed caret
      // above, so a caret sharing a marker's cell is hidden underneath. Repaint
      // it on top. Guarded to the collapsed case: cursor.draw then strokes only
      // the caret, so selection rects are never lifted over the highlights.
      if (textSegment && !this.cursor.isSelected()) {
        this.cursor.draw(this.ctx, this.viewport, this.text, {
          lineHeight: this.lineHeight,
          charWidth: this.charWidth,
          charsAtLine: this.text.charsAtLine,
          caretWidth: this.caretWidth * this.ratio,
          caretVisible: this.canvasFocused && this.caretBlink.isVisible(),
          columnToPixelX: this.drawColumnToPixelX(),
        });
      }
    }

    // Issue #3108 — draw the draggable handles on top of the selection. Inside
    // the translated context (so use viewport-relative line coords, no scroll term).
    // Hidden while resizing an anchor: the selection is frozen and not shown, so
    // its handles must not show either (#2885).
    if (!this.selectionHidden) {
      this.drawSelectionHandles();
    }

    this.ctx.restore();

    if (this.scroller) {
      this.scroller.update(
        this.viewport.lineStart,
        this.viewport.lineEnd,
        this.scrollExtentLineCount(),
        this.viewport.scrollOffsetY,
        this.lineHeight
      );
    }
    if (this.lines) {
      this.lines.font = this.font;
      this.lines.lineHeight = this.lineHeight;
      this.lines.draw(this.viewport, this.text.noLines);
    }

    const thisRenderVieportLineStart = this.viewport.lineStart;
    if (this.previousRenderViewportLineStart !== thisRenderVieportLineStart) {
      this.onScrollCb?.(thisRenderVieportLineStart);
      this.previousRenderViewportLineStart = thisRenderVieportLineStart;
    }

    if (this.showFps) {
      this.drawFpsCounter();
    }
  }

  /** Current collapsed-caret width in CSS px. */
  getCaretWidth(): number {
    return this.caretWidth;
  }

  /** Set the collapsed-caret width in CSS px (e.g. 1, 2, 3) and redraw. */
  setCaretWidth(px: number): void {
    this.caretWidth = Math.max(1, px);
    this.saveSettings();
    this.draw();
  }

  /**
   * Load persisted settings from localStorage and apply them to the fields
   * (without redrawing — the constructor draws once afterwards). Safe to call
   * when storage is unavailable or holds malformed data.
   */
  private loadSettings(): void {
    let parsed: PersistedSettings | null = null;
    try {
      const raw = typeof localStorage !== "undefined" && localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        parsed = JSON.parse(raw) as PersistedSettings;
      }
    } catch {
      return; // storage blocked or corrupt — fall back to defaults
    }
    if (!parsed) {
      return;
    }

    if (typeof parsed.caretWidth === "number") {
      this.caretWidth = Math.max(1, parsed.caretWidth);
    }
    if (typeof parsed.highlightColor === "string") {
      this.highlightColor = parsed.highlightColor;
      this.cursor.style = { ...this.cursor.style, color: this.highlightColor };
    }
    if (typeof parsed.showFps === "boolean") {
      this.showFps = parsed.showFps;
    }

    // Font settings (#2487). Set the fields first, then re-derive font/layout
    // once (no redraw — the constructor draws right after loadSettings).
    let fontChanged = false;
    if (typeof parsed.fontSize === "number") {
      this.fontSize = Math.max(1, parsed.fontSize);
      fontChanged = true;
    }
    if (typeof parsed.fontFamily === "string") {
      this.proportionalFontFamily = parsed.fontFamily;
      fontChanged = true;
    }
    if (typeof parsed.proportional === "boolean") {
      this.proportional = parsed.proportional;
      fontChanged = true;
    }
    if (fontChanged) {
      this.applyFontChange(false);
    }
  }

  /** Reset all persisted settings to their defaults, clear storage, and redraw. */
  resetSettings(): void {
    this.caretWidth = 1;
    this.highlightColor = undefined;
    // Revert the highlight color to the host theme color (last setSelectStyle).
    this.cursor.style = { ...this.cursor.style, color: this.selectColor };
    this.showFps = false;
    this.lastFrameTime = 0;
    this.fps = 0;
    // Font settings back to defaults (#2487).
    this.proportional = false;
    this.fontSize = DEFAULT_FONT_SIZE;
    // Default to the first host-supplied option (e.g. "Sans (app)") so the
    // picker shows a valid value; fall back to the generic when none supplied.
    this.proportionalFontFamily =
      this.fontFamilyOptions.length > 0 ? this.fontFamilyOptions[0].value : PROPORTIONAL_FONT;

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }

    // Re-derive font/layout to the monospace defaults and redraw.
    this.applyFontChange();
  }

  /** Persist the current settings to localStorage (best-effort). */
  private saveSettings(): void {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }
      const data: PersistedSettings = {
        caretWidth: this.caretWidth,
        highlightColor: this.highlightColor,
        showFps: this.showFps,
        proportional: this.proportional,
        fontFamily: this.proportionalFontFamily,
        fontSize: this.fontSize,
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or blocked — settings just won't persist this session
    }
  }

  /**
   * Current selection highlight color as a `#rrggbb` hex string. When the user
   * hasn't picked one, this reflects the effective (theme) color so the picker
   * shows the real default rather than black.
   */
  getHighlightColor(): string {
    return this.highlightColor ?? this.cssColorToHex(this.cursor.style.color as string);
  }

  /**
   * Normalize any CSS color (named/rgb/hex) to `#rrggbb` using the canvas, which
   * a native color input requires. Falls back to black for non-opaque colors.
   */
  private cssColorToHex(color: string): string {
    try {
      const prev = this.ctx.fillStyle;
      this.ctx.fillStyle = color;
      const normalized = this.ctx.fillStyle;
      this.ctx.fillStyle = prev;
      if (typeof normalized === "string" && normalized.startsWith("#")) {
        return normalized;
      }
    } catch {
      // ignore and fall through to default
    }
    return "#000000";
  }

  /** Set the selection highlight color (`#rrggbb`) and redraw. */
  setHighlightColor(hex: string): void {
    this.highlightColor = hex;
    this.cursor.style = { ...this.cursor.style, color: hex };
    this.saveSettings();
    this.draw();
  }

  /**
   * Toggle the debug FPS counter in the top-left corner. Disabled by default.
   */
  setShowFps(show: boolean): void {
    this.showFps = show;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.saveSettings();
    this.draw();
  }

  /**
   * Update the smoothed FPS from the interval between draw() calls. This is an
   * on-demand renderer (no rAF loop), so the value reflects redraw frequency
   * during activity and dips after idle gaps.
   */
  private updateFps() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.lastFrameTime > 0) {
      const dt = now - this.lastFrameTime;
      if (dt > 0) {
        const instantaneous = 1000 / dt;
        // Exponential moving average smooths jitter between on-demand redraws.
        this.fps = this.fps === 0 ? instantaneous : this.fps * 0.8 + instantaneous * 0.2;
      }
    }
    this.lastFrameTime = now;
  }

  /** Draw the debug FPS counter in the top-left corner (screen space). */
  private drawFpsCounter() {
    const text = `${Math.round(this.fps)} FPS`;
    const pad = 4 * this.ratio;
    const fontSize = 11 * this.ratio;

    this.ctx.save();
    this.ctx.font = `${fontSize}px ${DEFAULT_FONT}`;
    this.ctx.textBaseline = "top";
    const textW = this.ctx.measureText(text).width;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(0, 0, textW + pad * 2, fontSize + pad * 2);
    this.ctx.fillStyle = "#0f0";
    this.ctx.fillText(text, pad, pad);
    this.ctx.restore();
  }

  /**
   * change display mode and recalculate drawn lines
   * @param mode
   */
  setMode(mode: EditMode) {
    // A mode switch ends any in-progress typing run for undo coalescing.
    this.history.endCoalescing();

    let absIndex: number | null = null;
    if (this.cursor.xLine >= 0 && this.cursor.yLine >= 0) {
      const segPos = this.text.cursorToIndex(this.viewport, this.cursor);
      if (segPos !== null) {
        absIndex = this.text.getAbsTextIndexFromPosition(segPos);
      }
    }

    const viewportRawIndex = this.getViewportStartInRawText();
    const scrollOffsetBefore = this.viewport.scrollOffsetY;

    this.element.classList.remove(this.text.mode);
    this.element.classList.add(mode);

    this.text.mode = mode;
    this.cursor.reset();
    this.text.prepareSegments();
    this.text.calculateLines();

    const newPos = this.text.getSegmentFromAbsTextIndex(viewportRawIndex);
    if (newPos) {
      const segment = this.text.segments[newPos.segmentIndex];
      const absLine = segment.lineStart + newPos.lineIndex;
      this.viewport.lineStart = Math.max(
        0,
        Math.min(absLine, Math.max(0, this.scrollExtentLineCount() - 1 - this.viewport.noLines))
      );
      this.viewport.scrollOffsetY = scrollOffsetBefore;
    }

    if (absIndex !== null && absIndex >= 0) {
      const segPos = this.text.getSegmentFromAbsTextIndex(absIndex);
      if (segPos !== null) {
        const coords = this.text.positionToCursor(this.viewport, segPos);
        if (coords !== null) {
          // Re-derive the caret's visual position in the new mode so its
          // document position is preserved across the switch. Deliberately do
          // NOT scroll the viewport to the caret here: switching edit modes
          // keeps the reader on the same content (the viewport was just
          // restored above, per #2904). Snapping to an off-screen caret —
          // one the user had scrolled away from — would defeat that.
          const absY = this.viewport.lineStart + coords.yLine;
          this.cursor.setPosition(coords.xLine, absY);
        }
      }
    }
  }

  /**
   * Walks `raw` from `from` in `direction`, skipping complete tag markup, until
   * exactly one visible (non-markup) character is consumed. `\n` counts as a
   * visible character, so anchor boundaries can cross line/segment boundaries.
   *
   * @returns the consumed character's index plus the names of tags skipped on
   * the way, or null when the document edge is reached first
   */
  private scanOneVisibleChar(
    raw: string,
    from: number,
    direction: -1 | 1
  ): { charIndex: number; crossedTagNames: string[] } | null {
    const crossedTagNames: string[] = [];
    let i = from;

    if (direction === 1) {
      while (i < raw.length) {
        if (raw[i] === "<") {
          const gt = raw.indexOf(">", i);
          if (gt !== -1) {
            const candidate = raw.slice(i, gt + 1);
            if (wholeTagRegex.test(candidate)) {
              crossedTagNames.push(getTagNameFromMarkup(candidate));
              i = gt + 1;
              continue;
            }
          }
        }
        return { charIndex: i, crossedTagNames };
      }
      return null;
    }

    while (i > 0) {
      if (raw[i - 1] === ">") {
        const lt = raw.lastIndexOf("<", i - 1);
        if (lt !== -1) {
          const candidate = raw.slice(lt, i);
          if (wholeTagRegex.test(candidate)) {
            crossedTagNames.push(getTagNameFromMarkup(candidate));
            i = lt;
            continue;
          }
        }
      }
      return { charIndex: i - 1, crossedTagNames };
    }
    return null;
  }

  /** Whether at least one visible (non-markup) character exists in raw[start, end). */
  private hasVisibleCharBetween(raw: string, start: number, end: number): boolean {
    const scan = this.scanOneVisibleChar(raw, start, 1);
    return scan !== null && scan.charIndex < end;
  }

  /**
   * Resolves an anchor to its opening + pairing closing {@link Tag} against the
   * current segments, using the same exact-then-nearest matching and
   * nearest-following-close pairing as {@link moveAnchorBoundary}. Returns null
   * when the anchor cannot be resolved (unknown name, or asymmetrical).
   */
  private resolveAnchorTags(
    tagName: string,
    openTagRef: AnchorOpenTagRef
  ): { openTag: Tag; closeTag: Tag } | null {
    const segments = this.text.segments;

    let openTag: Tag | undefined;
    const refSegment = segments[openTagRef.segmentIndex];
    if (refSegment) {
      openTag = refSegment.openingTags.find(
        (t) => t.getTagName() === tagName && t.position === openTagRef.position
      );
    }
    if (!openTag) {
      let refAbs = openTagRef.position;
      for (let i = 0; i < Math.min(openTagRef.segmentIndex, segments.length); i++) {
        refAbs += segments[i].raw.length + 1;
      }
      let bestDistance = Infinity;
      for (const segment of segments) {
        for (const candidate of segment.openingTags) {
          if (candidate.getTagName() !== tagName) {
            continue;
          }
          const distance = Math.abs(candidate.getAbsoluteTagPosition(segments) - refAbs);
          if (distance < bestDistance) {
            bestDistance = distance;
            openTag = candidate;
          }
        }
      }
    }
    if (!openTag) {
      return null;
    }

    const resolvedOpenTag = openTag;
    let closeTag: Tag | undefined;
    for (let i = resolvedOpenTag.segmentIndex; i < segments.length; i++) {
      const candidates =
        i === resolvedOpenTag.segmentIndex
          ? segments[i].closingTags.filter((t) => t.position > resolvedOpenTag.position)
          : segments[i].closingTags;
      closeTag = candidates.find((t) => t.getTagName() === tagName);
      if (closeTag) {
        break;
      }
    }
    if (!closeTag) {
      return null;
    }
    return { openTag: resolvedOpenTag, closeTag };
  }

  /**
   * Highlight schemas the resize pulse (#2885) draws for the given entity.
   * Every span schema of the entity pulses (its static copy is suppressed
   * while resizing); ANCHOR schemas are excluded — they are point markers
   * with no fill (#2887) and stay drawn statically. FOCUS (the tree-selected
   * Territory's inverted wash, which dims everything OUTSIDE the span) is
   * remapped to a BACKGROUND wash ON the span, so resizing reads as a positive
   * highlight of the span rather than an inverted dimming of its surroundings.
   * Entities whose schemas contain no fill at all (Statement's underline,
   * Territory's markers) get an extra BACKGROUND wash in their class colour
   * appended, so the resized span always reads as an area rather than just a
   * blinking line.
   */
  private getResizePulseSchemas(tagName: string): HighlightSchema[] {
    const result = this.onHighlightCb?.(tagName);
    const schemas = Array.isArray(result) ? result : result ? [result] : [];
    const pulseSchemas = schemas
      .filter((s) => s.mode !== HighlightMode.ANCHOR)
      .map((s) =>
        s.mode === HighlightMode.FOCUS ? { mode: HighlightMode.BACKGROUND, style: s.style } : s
      );
    const hasFill = pulseSchemas.some((s) => s.mode === HighlightMode.BACKGROUND);
    if (!hasFill && schemas.length) {
      pulseSchemas.push({ mode: HighlightMode.BACKGROUND, style: schemas[0].style });
    }
    return pulseSchemas;
  }

  /** Parsed start/end coordinates of an anchor's span, for drawing the pulse overlay. */
  private getAnchorSpanCoords(
    tagName: string,
    openTagRef: AnchorOpenTagRef
  ): { start: IAbsCoordinates; end: IAbsCoordinates } | null {
    const resolved = this.resolveAnchorTags(tagName, openTagRef);
    if (!resolved) {
      return null;
    }
    const openSegment = this.text.segments[resolved.openTag.segmentIndex];
    const closeSegment = this.text.segments[resolved.closeTag.segmentIndex];
    if (!openSegment || !closeSegment) {
      return null;
    }
    const start = openSegment.findTagParsedPosition(resolved.openTag);
    const end = closeSegment.findTagParsedPosition(resolved.closeTag);
    return {
      start: { xLine: start.x, yLine: start.y },
      end: { xLine: end.x, yLine: end.y },
    };
  }

  /**
   * Scrolls the given raw index into view only when it currently sits outside
   * the visible line range, so the resized anchor (or a boundary that just
   * moved off-screen) stays visible without snapping the viewport otherwise.
   */
  private ensureRawIndexVisible(rawIndex: number): void {
    const pos = this.text.getSegmentFromAbsTextIndex(rawIndex);
    if (!pos) {
      return;
    }
    const segment = this.text.segments[pos.segmentIndex];
    if (!segment) {
      return;
    }
    const absLine = segment.lineStart + pos.lineIndex;
    if (absLine < this.viewport.lineStart || absLine > this.viewport.lineEnd) {
      this.scrollToRawPosition(rawIndex);
    }
  }

  /**
   * Enters anchor-resize mode (#2885): the anchor identified by `openTagRef`
   * starts pulsing in its own class colour, the current text selection is
   * frozen and hidden (so the blue selection disappears but its position is
   * kept for restoration), and the anchor is scrolled into view if off-screen.
   */
  beginAnchorResize(tagName: string, openTagRef: AnchorOpenTagRef): void {
    this.resizeAnchor = { tagName, openTagRef };
    this.selectionHidden = true;
    const resolved = this.resolveAnchorTags(tagName, openTagRef);
    if (resolved) {
      this.ensureRawIndexVisible(resolved.openTag.getAbsoluteTagPosition(this.text.segments));
    }
    this.resizePulse.start();
    this.draw();
  }

  /**
   * Leaves anchor-resize mode: stops the pulse and unhides the frozen selection,
   * which repaints at its original position (the cursor bounds were never
   * mutated during resize).
   */
  endAnchorResize(): void {
    this.resizePulse.stop();
    this.resizeAnchor = null;
    this.selectionHidden = false;
    this.draw();
  }

  /**
   * Scrolls one boundary (opening or closing tag) of the anchor currently being
   * resized into view (#2885). A long span often has its start and end off the
   * same screen; this lets the move panel jump the viewport to either end so the
   * user can see the boundary they are nudging. Returns false when no resize is
   * active or the anchor cannot be resolved.
   */
  scrollResizeAnchorBoundaryIntoView(boundary: "open" | "close"): boolean {
    if (!this.resizeAnchor) {
      return false;
    }
    const resolved = this.resolveAnchorTags(
      this.resizeAnchor.tagName,
      this.resizeAnchor.openTagRef
    );
    if (!resolved) {
      return false;
    }
    const tag = boundary === "open" ? resolved.openTag : resolved.closeTag;
    // For the closing boundary leave one line of context above so the span's end
    // (and its blinking pulse) lands on the second visible line instead of being
    // clipped at the very top edge. The opening boundary stays at the top (#2885).
    const lineOffset = boundary === "close" ? -1 : 0;
    this.scrollToRawPosition(tag.getAbsoluteTagPosition(this.text.segments), lineOffset);
    return true;
  }

  /**
   * Moves one boundary (opening or closing tag) of an existing anchor by
   * exactly one visible character (issue #2885). The anchor is identified by
   * its opening tag's location; each successful move returns the new location
   * so repeated calls stay locked onto the same anchor across re-parses.
   *
   * The moved tag is re-inserted immediately adjacent to the character stepped
   * over — intervening markup is skipped, so a tag never lands inside another
   * tag's markup. Crossing a tag with the SAME name is refused (name-based
   * pairing would re-pair and corrupt both spans); crossing other entities'
   * tags is legal and may create overlapping spans.
   */
  moveAnchorBoundary(
    tagName: string,
    openTagRef: AnchorOpenTagRef,
    boundary: "open" | "close",
    direction: -1 | 1
  ): MoveAnchorBoundaryResult {
    const segments = this.text.segments;

    // Resolve the opening tag: exact ref match, else nearest same-name opening
    // tag by absolute raw distance (the ref goes stale when an earlier edit
    // shifted raw positions).
    let openTag: Tag | undefined;
    const refSegment = segments[openTagRef.segmentIndex];
    if (refSegment) {
      openTag = refSegment.openingTags.find(
        (t) => t.getTagName() === tagName && t.position === openTagRef.position
      );
    }
    if (!openTag) {
      let refAbs = openTagRef.position;
      for (let i = 0; i < Math.min(openTagRef.segmentIndex, segments.length); i++) {
        refAbs += segments[i].raw.length + 1;
      }
      let bestDistance = Infinity;
      for (const segment of segments) {
        for (const candidate of segment.openingTags) {
          if (candidate.getTagName() !== tagName) {
            continue;
          }
          const distance = Math.abs(candidate.getAbsoluteTagPosition(segments) - refAbs);
          if (distance < bestDistance) {
            bestDistance = distance;
            openTag = candidate;
          }
        }
      }
    }
    if (!openTag) {
      return { status: "not-found" };
    }

    // Pairing closing tag: nearest following same-name closing tag (same rule
    // as removeAnchorFromSelection).
    const resolvedOpenTag = openTag;
    let closeTag: Tag | undefined;
    for (let i = resolvedOpenTag.segmentIndex; i < segments.length; i++) {
      const candidates =
        i === resolvedOpenTag.segmentIndex
          ? segments[i].closingTags.filter((t) => t.position > resolvedOpenTag.position)
          : segments[i].closingTags;
      closeTag = candidates.find((t) => t.getTagName() === tagName);
      if (closeTag) {
        break;
      }
    }
    if (!closeTag) {
      return { status: "not-found" };
    }

    const raw = this.text.value;
    const openAbs = resolvedOpenTag.getAbsoluteTagPosition(segments);
    const closeAbs = closeTag.getAbsoluteTagPosition(segments);

    // Splice the moving tag out verbatim — slice the raw text rather than
    // re-serializing the Tag, so exotic attribute spacing/quoting survives.
    const movingAbs = boundary === "open" ? openAbs : closeAbs;
    const movingEnd = raw.indexOf(">", movingAbs) + 1;
    const movingMarkup = raw.slice(movingAbs, movingEnd);
    const rawWithout = raw.slice(0, movingAbs) + raw.slice(movingEnd);

    // The other boundary's index within rawWithout (close is always after
    // open, so removing the close never shifts the open).
    const otherAbs = boundary === "open" ? closeAbs - movingMarkup.length : openAbs;

    const scan = this.scanOneVisibleChar(rawWithout, movingAbs, direction);
    if (scan === null) {
      return { status: "blocked-bounds" };
    }
    // Insert immediately adjacent to the consumed character: before it when
    // moving left, after it when moving right.
    const insertAt = direction === -1 ? scan.charIndex : scan.charIndex + 1;

    // The span must keep at least one visible character.
    if (boundary === "open") {
      if (!this.hasVisibleCharBetween(rawWithout, insertAt, otherAbs)) {
        return { status: "blocked-bounds" };
      }
    } else {
      const openTagEnd = rawWithout.indexOf(">", otherAbs) + 1;
      if (!this.hasVisibleCharBetween(rawWithout, openTagEnd, insertAt)) {
        return { status: "blocked-bounds" };
      }
    }

    if (scan.crossedTagNames.includes(tagName)) {
      return { status: "blocked-same-name" };
    }

    this.text.value = rawWithout.slice(0, insertAt) + movingMarkup + rawWithout.slice(insertAt);
    this.text.prepareSegments();
    this.text.calculateLines();

    // Locate the opening tag's new absolute position and convert it to a
    // (segmentIndex, position) ref against the freshly parsed segments.
    const newOpenAbs = boundary === "open" ? insertAt : openAbs;
    const newSegments = this.text.segments;
    let segmentIndex = 0;
    let position = newOpenAbs;
    while (
      segmentIndex < newSegments.length - 1 &&
      position > newSegments[segmentIndex].raw.length
    ) {
      position -= newSegments[segmentIndex].raw.length + 1;
      segmentIndex++;
    }

    if (this.resizeAnchor) {
      // Resize mode owns the visuals: keep tracking the anchor for the pulse
      // overlay and keep the just-moved boundary on screen. The selection is
      // deliberately NOT touched (it stays frozen and hidden), so the pulse is
      // the only feedback and the menu's selection state doesn't churn (#2885).
      this.resizeAnchor = { tagName, openTagRef: { segmentIndex, position } };
      this.ensureRawIndexVisible(insertAt);
    } else {
      // Re-resolve both tags to select the moved span — the same visual feedback
      // addAnchor gives after creating an anchor.
      const movedOpenSegment = newSegments[segmentIndex];
      const movedOpenTag = movedOpenSegment?.openingTags.find(
        (t) => t.getTagName() === tagName && t.position === position
      );
      if (movedOpenTag) {
        let movedCloseTag: Tag | undefined;
        let movedCloseSegmentIndex = -1;
        for (let i = segmentIndex; i < newSegments.length; i++) {
          const candidates =
            i === segmentIndex
              ? newSegments[i].closingTags.filter((t) => t.position > movedOpenTag.position)
              : newSegments[i].closingTags;
          const found = candidates.find((t) => t.getTagName() === tagName);
          if (found) {
            movedCloseTag = found;
            movedCloseSegmentIndex = i;
            break;
          }
        }
        if (movedCloseTag) {
          const start = movedOpenSegment.findTagParsedPosition(movedOpenTag);
          const end = newSegments[movedCloseSegmentIndex].findTagParsedPosition(movedCloseTag);
          this.cursor.selectStart = { xLine: start.x, yLine: start.y };
          this.cursor.selectEnd = { xLine: end.x, yLine: end.y };
          this.cursor.setTrueSelectionDirection();
        }
      }
    }

    this.runWarningChecks();
    this.draw();

    return { status: "moved", openTagRef: { segmentIndex, position } };
  }

  /**
   * Adds an anchor tag around the currently selected text.
   *
   * This function wraps the selected text with opening and closing XML-like tags.
   * It handles text selection bounds, sanitizes the envelope range to avoid
   * including unwanted neighboring tags, and updates the text content accordingly.
   *
   * @param anchor - The tag name to wrap around the selected text (e.g., "person", "location")
   * @param attributes - Optional attributes to add to the opening tag (e.g., {id: "123", type: "proper"})
   *
   * @example
   * // Wrap selected text with a person tag
   * addAnchor("person");
   *
   * // Wrap selected text with a location tag and attributes
   * addAnchor("location", {id: "loc1", type: "city"});
   */
  addAnchor(anchor: string, attributes?: Record<string, string>) {
    if (!this.cursor.isSelected()) {
      return;
    }

    // Construct the Tag at the start
    const openTag = new Tag(0, anchor, false, undefined, -1);
    if (attributes) {
      openTag.setAttributes(attributes);
    }
    const closeTag = new Tag(0, anchor, true, undefined, -1);

    // get bounds of the selection
    let [start, end] = this.cursor.getAbsBounds();
    if (start && end) {
      // Use current mode (not forced raw mode) since cursor positions are in current mode
      let indexStart = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(start.yLine, start.xLine)
      );
      let indexEnd = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(end.yLine, end.xLine)
      );

      // Move endIndex after tags on the right to avoid gathering additional non-XML tag characters
      // after this we have envelope around neighboring tags
      indexEnd = this.skipTagsOnRight(indexEnd);
      // Sanitize envelope range by removing enveloping tags from both left and right sides
      const raw = this.text.value;
      let minTagStart = raw.length;
      let maxTagEnd = 0;
      const openR = new RegExp(openingTagRegex.source, openingTagRegex.flags);
      const closeR = new RegExp(closingTagRegex.source, closingTagRegex.flags);
      let m: RegExpExecArray | null;
      while ((m = openR.exec(raw)) !== null) {
        minTagStart = Math.min(minTagStart, m.index);
        maxTagEnd = Math.max(maxTagEnd, m.index + m[0].length);
      }
      while ((m = closeR.exec(raw)) !== null) {
        minTagStart = Math.min(minTagStart, m.index);
        maxTagEnd = Math.max(maxTagEnd, m.index + m[0].length);
      }
      const selectionEncompassesAllTags =
        minTagStart <= maxTagEnd && indexStart <= minTagStart && indexEnd >= maxTagEnd;
      if (selectionEncompassesAllTags) {
        if (indexStart === 0) {
          indexEnd = raw.length;
        }
      } else {
        [indexStart, indexEnd] = this.sanitizeEnvelopeRange(indexStart, indexEnd);
      }

      // could be '<tag>text .... text</tag> (closing tag always included if present)
      const selectedRawText = this.text.value.slice(indexStart, indexEnd);
      const beforeText = this.text.value.slice(0, indexStart);
      const afterText = this.text.value.slice(indexEnd);

      const openTagString = openTag.getTag();
      const closeTagString = closeTag.getTag();

      this.text.value = beforeText + openTagString + selectedRawText + closeTagString + afterText;

      this.text.prepareSegments();
      this.text.calculateLines();

      // Find the newly added anchor and select it
      const tagPosition = this.text.getTagPosition(openTag.getTagName(), 0);
      if (tagPosition && tagPosition.length === 2) {
        this.cursor.selectStart = tagPosition[0];
        this.cursor.selectEnd = tagPosition[1];
        this.cursor.setTrueSelectionDirection();
      } else {
        this.cursor.reset();
      }

      this.runWarningChecks();
      this.draw();
    }
  }

  updateAnchor(tag: Tag, attributes?: Record<string, string>) {
    // Only accept opening tags
    if (tag.closing) {
      throw new Error("updateAnchor only accepts opening tags");
    }

    // Use the segmentIndex from the tag
    const tagSegmentIndex = tag.segmentIndex;

    if (tagSegmentIndex === -1) {
      throw new Error("Tag segmentIndex not set");
    }

    // Calculate the absolute text index from the tag's position within its segment
    let absoluteTagPosition = tag.position;
    // Add lengths of all previous segments
    for (let i = 0; i < tagSegmentIndex; i++) {
      absoluteTagPosition += this.text.segments[i].raw.length + 1; // +1 for newline between segments
    }

    // Build the original tag string using the tag's current attributes
    const originalTag = new Tag(0, tag.getTagName(), false, undefined, -1);
    originalTag.setAttributes(tag.attributes);
    const originalTagString = originalTag.getTag();
    const originalTagLength = originalTagString.length;

    // Build the new tag string with updated attributes
    const newTag = new Tag(0, tag.getTagName(), false, undefined, -1);
    if (attributes) {
      newTag.setAttributes(attributes);
    } else {
      newTag.setAttributes({});
    }
    const newTagString = newTag.getTag();

    // Replace the old tag with the new tag in the raw text
    const rawText = this.text.value;
    const beforeText = rawText.slice(0, absoluteTagPosition);
    const afterText = rawText.slice(absoluteTagPosition + originalTagLength);

    this.text.value = beforeText + newTagString + afterText;

    // Update segments and recalculate lines
    this.text.prepareSegments();
    this.text.calculateLines();

    // Trigger callbacks and redraw
    this.runWarningChecks();
    this.draw();
  }

  /**
   * Scrolls the viewport to the anchor and moves the caret to the first character
   * inside the anchor (after the opening tag in raw text).
   * Uses {@link Text.getSegmentFromAbsTextIndex} so line/column match RAW/XML and
   * highlight modes (see {@link Segment.findTagParsedPosition} vs wrapped lines).
   * Clears selection, then focuses the canvas for keyboard input.
   */
  scrollToAnchor(tag: string, index: number = 0) {
    let openingTag: Tag | undefined;
    let occurrence = 0;
    outer: for (const segment of this.text.segments) {
      for (const open of segment.openingTags) {
        if (open.getTagName() === tag) {
          if (occurrence === index) {
            openingTag = open;
            break outer;
          }
          occurrence++;
        }
      }
    }

    if (!openingTag) {
      return;
    }

    // Scroll to where the anchored content starts (just past the opening tag).
    this.scrollCaretToRawIndex(
      openingTag.getAbsoluteTagPosition(this.text.segments) + openingTag.getTagLength()
    );
  }

  scrollToLine(absLine: number) {
    this.viewport.scrollTo(absLine, this.scrollExtentLineCount());
    this.draw();
  }

  /**
   * Returns the absolute character index in raw text that corresponds to the start of the viewport (first visible character at the top of the canvas).
   */
  getViewportStartInRawText(): number {
    const pos = this.text.getSegmentPosition(this.viewport.lineStart, 0);
    if (!pos) return 0;
    return this.text.getAbsTextIndexFromPosition(pos);
  }

  /**
   * Scrolls the viewport so that the given raw text character index is at the top
   * of the visible area. `lineOffset` shifts the target line (e.g. -1 leaves one
   * line of context above so the position lands on the second visible line).
   */
  scrollToRawPosition(rawIndex: number, lineOffset: number = 0): void {
    const pos = this.text.getSegmentFromAbsTextIndex(rawIndex);
    if (!pos) return;
    const segment = this.text.segments[pos.segmentIndex];
    const absLine = Math.max(0, segment.lineStart + pos.lineIndex + lineOffset);
    this.viewport.scrollTo(absLine, this.scrollExtentLineCount());
    this.draw();
  }

  updateText(newText: string) {
    const positionBeforeChange = this.viewport.lineStart;
    const scrollOffsetBeforeChange = this.viewport.scrollOffsetY;

    this.text.value = newText;
    this.text.prepareSegments();
    this.text.calculateLines();
    this.runWarningChecks();

    // Preserve fluent scroll offset (deltaY) so updating text (e.g. discard)
    // doesn't snap the viewport to the top of a line.
    const maxLineStart = Math.max(0, this.scrollExtentLineCount() - 1 - this.viewport.noLines);
    const clampedLineStart = Math.max(0, Math.min(positionBeforeChange, maxLineStart));
    const desiredLineStart = clampedLineStart + (scrollOffsetBeforeChange || 0) / this.lineHeight;

    this.viewport.setScrollPosition(
      desiredLineStart,
      0,
      this.lineHeight,
      this.scrollExtentLineCount()
    );
    this.draw();
  }

  /**
   * searches for substring or regex pattern in the whole text, returning prepared Occurrence data
   * @param toFind
   * @param isRegex
   * @returns
   */
  search(toFind: string, isRegex: boolean = false, isCaseSensitive: boolean = true): Occurrence[] {
    const occurrences = [];
    const normalizedTerm = isCaseSensitive ? toFind : toFind.toLowerCase();

    const collectLiteralOccurrences = (line: string, segmentIndex: number, lineIndex: number) => {
      const normalizedLine = isCaseSensitive ? line : line.toLowerCase();
      let startIndex = 0;

      while (startIndex < normalizedLine.length) {
        const index = normalizedLine.indexOf(normalizedTerm, startIndex);
        if (index === -1) {
          break;
        }

        occurrences.push({
          segmentIndex,
          lineIndex,
          start: index,
          end: index + toFind.length,
        });

        startIndex = index + 1;
      }
    };

    for (const segmentI in this.text.segments) {
      for (const lineI in this.text.segments[segmentI].lines) {
        const line = this.text.segments[segmentI].lines[lineI];

        if (isRegex) {
          try {
            const regexFlags = isCaseSensitive ? "gu" : "giu";
            const regex = new RegExp(toFind, regexFlags);
            let match;
            while ((match = regex.exec(line)) !== null) {
              occurrences.push({
                segmentIndex: parseInt(segmentI),
                lineIndex: parseInt(lineI),
                start: match.index,
                end: match.index + match[0].length,
              });
            }
          } catch (error) {
            // If regex is invalid, treat as literal string
            collectLiteralOccurrences(line, parseInt(segmentI, 10), parseInt(lineI, 10));
          }
        } else {
          collectLiteralOccurrences(line, parseInt(segmentI, 10), parseInt(lineI, 10));
        }
      }
    }

    return occurrences;
  }

  /**
   * Given the Occurrence argument, the method will use its value to select respective part of the text + scroll to the line at which is resides
   * @param occurence
   */
  selectSearchOccurrence(occurence: Occurrence) {
    const absY = this.text.segments[occurence.segmentIndex].lineStart + occurence.lineIndex;
    this.cursor.xLine = occurence.end;
    this.cursor.yLine = absY;

    this.cursor.selectStart = {
      xLine: occurence.start,
      yLine: absY,
    };
    this.cursor.selectEnd = {
      xLine: occurence.end,
      yLine: absY,
    };

    this.scrollToLine(this.cursor.selectStart.yLine);
    this.draw();

    // Manually trigger onSelectText callback for search-based selections
    if (this.onSelectTextCb) {
      const [start, end] = this.cursor.getAbsBounds();

      if (start && end) {
        const startSegment = this.text.getSegmentPosition(
          start.yLine,
          start.xLine
        ) as SegmentPosition;
        const endSegment = this.text.getSegmentPosition(end.yLine, end.xLine) as SegmentPosition;
        const annotated = this.getAnnotations(startSegment, endSegment);
        this.onSelectTextCb({
          text: this.text.getRangeText(start, end),
          anchors: annotated,
          index: this.text.getAbsTextIndexFromPosition(
            this.text.getSegmentPosition(start.yLine, start.xLine)
          ),
        });
      }
    }
  }

  // ===== undo/redo (#3086) =====

  /** Capture the live editor state (raw value + canonical caret/selection offsets). */
  captureSnapshot(): HistorySnapshot {
    return {
      value: this.text.value,
      anchor: this.cursor.anchor,
      head: this.cursor.head,
      anchorAffinity: this.cursor.anchorAffinity,
      headAffinity: this.cursor.headAffinity,
    };
  }

  /**
   * Restore a snapshot: reload the document string, reparse/rewrap, set the
   * caret/selection offsets and derive the visual caret, scroll it into view,
   * fire onTextChangeCb (when the value changed and editing is allowed) and draw.
   */
  private restoreSnapshot(snap: HistorySnapshot): void {
    const changed = this.text.value !== snap.value;

    this.text.value = snap.value;
    this.text.prepareSegments();
    this.text.calculateLines();

    this.cursor.anchor = snap.anchor;
    this.cursor.head = snap.head;
    this.cursor.anchorAffinity = snap.anchorAffinity;
    this.cursor.headAffinity = snap.headAffinity;
    this.cursor.syncVisualFromOffset(this.text);

    this.keys.scrollCursorIntoView();
    this.runWarningChecks();

    if (changed && this.text.mode !== EditMode.HIGHLIGHT && this.onTextChangeCb) {
      this.onTextChangeCb(this.text.value);
    }
    this.draw();
  }

  /**
   * Record the pre-mutation state on the undo stack. `coalesce` is true only for
   * a single-character typing insert, so a contiguous typing run becomes one
   * undo step; every other op is discrete. The post-edit caret offset is read
   * from the (already-updated) cursor for contiguity tracking.
   */
  recordHistory(before: HistorySnapshot, coalesce: boolean): void {
    this.history.record(before, coalesce, this.cursor.head);
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  /** Restore the previous document state, if any. */
  undo(): void {
    // Editing is disabled in HIGHLIGHT mode; undo would mutate the document
    // while restoreSnapshot suppresses onTextChangeCb, silently desyncing the
    // editor from the host app. Leave the stack untouched.
    if (this.text.mode === EditMode.HIGHLIGHT) {
      return;
    }
    const target = this.history.undo(this.captureSnapshot());
    if (target === null) {
      return;
    }
    this.restoreSnapshot(target);
  }

  /** Re-apply the most recently undone document state, if any. */
  redo(): void {
    if (this.text.mode === EditMode.HIGHLIGHT) {
      return;
    }
    const target = this.history.redo(this.captureSnapshot());
    if (target === null) {
      return;
    }
    this.restoreSnapshot(target);
  }

  onCopyText() {
    const area = this.cursor.getSelectedArea();
    const text = area
      ? this.text.getRangeText(area[0], area[1])
      : this.lastSelectedText?.text || "";
    window.navigator.clipboard.writeText(text);
  }

  onPasteText() {
    window.navigator.clipboard
      .readText()
      .then((clipText: string) => {
        // Snapshot the pre-paste state for undo (a paste is one discrete step).
        this.cursor.reconcileOffsetsFromVisual(this.text);
        const before = this.captureSnapshot();
        const area = this.cursor.getSelectedArea();
        if (area) {
          this.text.deleteRangeText(area[0], area[1]);
          this.cursor.reset();
          this.cursor.setPosition(area[0].xLine, area[0].yLine);
        }
        // Place the caret at insert-offset + length via the offset model. Unlike
        // move(len, 0) — which only shifts xLine and mishandles pasted newlines —
        // this lands correctly for multi-line text and stays in bounds.
        const insertOffset = this.text.offsetFromVisual(this.cursor.xLine, this.cursor.yLine);
        this.text.insertText(this.viewport, this.cursor, clipText);
        const pasteAt = insertOffset >= 0 ? insertOffset : this.cursor.head;
        this.cursor.moveToOffset(this.text, pasteAt + clipText.length);
        if (this.text.value !== before.value) {
          this.recordHistory(before, false);
        }
        this.keys.scrollCursorIntoView();

        this.runWarningChecks();
        this.draw();
      })
      .catch((err) => {
        console.error("Error reading clipboard", err);
      });
  }

  onReplaceText(text: string) {
    // Snapshot the pre-replace state for undo (replace is one discrete step).
    this.cursor.reconcileOffsetsFromVisual(this.text);
    const before = this.captureSnapshot();
    const area = this.cursor.getSelectedArea();
    if (area) {
      this.text.deleteRangeText(area[0], area[1]);
      this.cursor.reset();
      this.cursor.setPosition(area[0].xLine, area[0].yLine);
    }
    // See onPasteText: offset-based caret placement handles multi-line text.
    const insertOffset = this.text.offsetFromVisual(this.cursor.xLine, this.cursor.yLine);
    this.text.insertText(this.viewport, this.cursor, text);
    const insertAt = insertOffset >= 0 ? insertOffset : this.cursor.head;
    this.cursor.moveToOffset(this.text, insertAt + text.length);
    if (this.text.value !== before.value) {
      this.recordHistory(before, false);
    }
    this.keys.scrollCursorIntoView();

    this.runWarningChecks();
    this.draw();
  }

  /**
   * Enable warnings system
   */
  enableWarnings(): void {
    this.warnings.enable();
  }

  /**
   * Disable warnings system
   */
  disableWarnings(): void {
    this.warnings.disable();
  }

  /**
   * Check if warnings are enabled
   */
  isWarningsEnabled(): boolean {
    return this.warnings.isEnabled();
  }

  /**
   * clearSelection clears the current text selection and redraws the canvas
   */
  clearSelection() {
    this.cursor.reset();
    this.draw();
  }

  /**
   * Skip closing tags on the right side of the given index to avoid gathering additional non-XML tag characters
   * Only moves over closing tags when the selection ends exactly at the tag boundary, not when followed by normal text
   * Includes all consecutive closing tags
   * @param index The starting index
   * @returns The new index after skipping consecutive closing tags on the right
   */
  private skipTagsOnRight(index: number): number {
    const text = this.text.value;
    let newIndex = index;
    let currentIndex = index;

    while (true) {
      closingTagRegex.lastIndex = currentIndex;
      const match = closingTagRegex.exec(text);

      // If we find a closing tag that starts exactly at our current position
      if (match && match.index === currentIndex) {
        // Move the index to the end of this closing tag
        newIndex = match.index + match[0].length;
        currentIndex = newIndex;
        // Continue looking for more consecutive closing tags
      } else {
        // No more consecutive closing tags, stop
        break;
      }
    }

    return newIndex;
  }

  /**
   * Sanitizes the envelope range to prevent creating broken XML structure.
   *
   * When adding a new tag around selected text, this function ensures the new tag
   * doesn't split existing tag pairs. If the selection is smaller than a parent tag
   * that encompasses it, the indices are adjusted inward so the new tag is nested
   * INSIDE the parent tag rather than crossing its boundaries.
   *
   * Example:
   * - Text: `<p>test</p>`, parsed: "test"
   * - Selection "te" (indices 0-5 in raw text) should create: `<p><new>te</new>st</p>` ✓
   * - Not: `<new><p>te</new>st</p>` ✗
   *
   * Additional notes:
   * - Opening tags and closing tags as immediate neighbors are considered as they are on the same "parsed" position
   * - Arguments are always sanitized before calling this method that they are on the leftmost / rightmost possible position to encompass all tags on the conflicting positions
   * - We expect returned indexes to be moved so they are crossing as little tags (open + content + close) as possible
   *
   * @param indexStart The current start index of the text range
   * @param indexEnd The current end index of the text range
   * @returns Adjusted [indexStart, indexEnd] to ensure proper nesting
   */
  private sanitizeEnvelopeRange(indexStart: number, indexEnd: number): [number, number] {
    const raw = this.text.value;

    // Utility functions
    const clamp = (i: number): number => Math.max(0, Math.min(i, raw.length));

    const findAllTagPositionsInRange = (
      rangeStart: number,
      rangeEnd: number
    ): Array<{ start: number; end: number; name: string; isOpen: boolean }> => {
      const positions: Array<{
        start: number;
        end: number;
        name: string;
        isOpen: boolean;
      }> = [];

      // Search only within the selection range
      const searchText = raw.slice(rangeStart, rangeEnd);

      // Use existing regexes to find all tags in the search range
      const openingRegex = new RegExp(openingTagRegex.source, openingTagRegex.flags);
      const closingRegex = new RegExp(closingTagRegex.source, closingTagRegex.flags);

      // Find all opening tags
      let match;
      while ((match = openingRegex.exec(searchText)) !== null) {
        const absoluteStart = rangeStart + match.index;
        const absoluteEnd = rangeStart + match.index + match[0].length;
        const rawName = match[1] || "";
        const normalizedName = rawName.split(/\s+/)[0].toLowerCase();
        positions.push({
          start: absoluteStart,
          end: absoluteEnd,
          name: normalizedName,
          isOpen: true,
        });
      }

      // Find all closing tags
      while ((match = closingRegex.exec(searchText)) !== null) {
        const absoluteStart = rangeStart + match.index;
        const absoluteEnd = rangeStart + match.index + match[0].length;
        positions.push({
          start: absoluteStart,
          end: absoluteEnd,
          name: match[1].toLowerCase(),
          isOpen: false,
        });
      }

      // Sort by position to maintain order
      return positions.sort((a, b) => a.start - b.start);
    };

    const findRelevantTagPositions = (): Array<{
      start: number;
      end: number;
      name: string;
      isOpen: boolean;
    }> => findAllTagPositionsInRange(start, end);

    // Normalize and clamp
    let start = clamp(indexStart);
    let end = clamp(indexEnd);

    if (start > end) {
      [start, end] = [end, start];
    }

    if (start === end) {
      return [start, end];
    }

    const tagPositions = findRelevantTagPositions();
    // Check if start/end are inside text content (not inside tags)
    const isInsideText = (pos: number): boolean => {
      for (const tag of tagPositions) {
        if (pos >= tag.start && pos < tag.end) {
          return false; // Inside a tag (including at the start of a tag)
        }
      }
      return true; // Inside text content
    };

    // If both boundaries are in text content, no adjustment needed
    if (isInsideText(start) && isInsideText(end)) {
      if (start === 0 && end === raw.length) {
        return [start, end];
      }

      let isCompleteTagPair = false;

      // Check if this is a complete tag pair
      for (const tag of tagPositions) {
        if (tag.isOpen && start === tag.start) {
          const closingTag = tagPositions.find(
            (t) => !t.isOpen && t.name === tag.name && t.start > tag.start
          );
          if (closingTag && end === closingTag.end) {
            isCompleteTagPair = true;
            break;
          }
        }
      }

      const hasCompleteTagPairFullyContained = tagPositions.some((tag) => {
        if (!tag.isOpen) return false;
        const closingTag = tagPositions.find(
          (t) => !t.isOpen && t.name === tag.name && t.start > tag.start
        );
        return closingTag != null && start <= tag.start && end >= closingTag.end;
      });

      if (hasCompleteTagPairFullyContained) {
        return [start, end];
      }

      // Only contract if it's not a complete tag pair
      if (!isCompleteTagPair) {
        let contentStart = start;
        let contentEnd = end;

        // Find the rightmost opening tag within our selection
        for (const tag of tagPositions) {
          if (tag.isOpen && tag.start >= start && tag.start < end) {
            contentStart = Math.max(contentStart, tag.end);
          }
        }

        // Find the leftmost closing tag within our selection
        for (const tag of tagPositions) {
          if (!tag.isOpen && tag.end > start && tag.end <= end) {
            contentEnd = Math.min(contentEnd, tag.start);
          }
        }

        // If we found valid content boundaries, use them
        if (contentStart < contentEnd && contentStart >= start && contentEnd <= end) {
          return [clamp(contentStart), clamp(contentEnd)];
        }
      }

      return [start, end];
    }

    // Find tags that overlap with our selection
    const overlappingTags = tagPositions.filter((tag) => tag.start < end && tag.end > start);

    // Remove immediate closing nodes from the left neighbor group
    // This handles cases where selection starts with closing tags that should be excluded
    const immediateClosingTags = overlappingTags.filter(
      (tag) => !tag.isOpen && tag.start === start
    );

    // If selection starts with closing tags, remove them
    if (immediateClosingTags.length > 0) {
      // Find the rightmost closing tag (in case there are multiple at the same position)
      const rightmostClosingTag = immediateClosingTags.reduce((max, current) =>
        current.end > max.end ? current : max
      );

      // Move start past the closing tag(s)
      let adjustedStart = rightmostClosingTag.end;

      // Check if there's an opening tag immediately after the closing tag
      // and if the selection extends beyond it, remove that too
      const nextOpeningTag = overlappingTags.find(
        (tag) => tag.isOpen && tag.start === adjustedStart
      );

      if (nextOpeningTag && end > nextOpeningTag.end) {
        // Check if the selection ends with the matching closing tag for this opening tag
        const matchingClosingTag = tagPositions.find(
          (t) => !t.isOpen && t.name === nextOpeningTag.name && t.start > nextOpeningTag.start
        );

        // Only remove the opening tag if the selection doesn't include the complete tag pair
        if (!matchingClosingTag || end < matchingClosingTag.end) {
          // Remove the opening tag as well
          adjustedStart = nextOpeningTag.end;
        } else {
          // Keep the opening tag because selection includes complete tag pair
        }
      }

      // Also check for closing tags at the end that should be removed
      // But only remove them if they're not part of a complete tag pair
      let adjustedEnd = end;
      const closingTagsAtEnd = overlappingTags.filter((tag) => !tag.isOpen && tag.end === end);

      if (closingTagsAtEnd.length > 0) {
        // Find the leftmost closing tag at the end
        const leftmostClosingTagAtEnd = closingTagsAtEnd.reduce((min, current) =>
          current.start < min.start ? current : min
        );

        // Check if this closing tag is part of a complete tag pair
        // Find the closest opening tag before this closing tag
        const matchingOpeningTag = tagPositions
          .filter(
            (t) =>
              t.isOpen &&
              t.name === leftmostClosingTagAtEnd.name &&
              t.start < leftmostClosingTagAtEnd.start
          )
          .reduce((closest, current) => (current.start > closest.start ? current : closest), {
            start: -1,
            end: -1,
            name: "",
            isOpen: false,
          });

        // Only remove the closing tag if it's not part of a complete tag pair
        if (!matchingOpeningTag || matchingOpeningTag.start < adjustedStart) {
          // Move end before the closing tag(s)
          adjustedEnd = leftmostClosingTagAtEnd.start;
        } else {
          // Keep the closing tag because it's part of complete tag pair
        }
      }

      return [clamp(adjustedStart), clamp(adjustedEnd)];
    }

    // If no overlapping tags, return unchanged
    if (overlappingTags.length === 0) {
      return [start, end];
    }

    // Check if the selection exactly matches a complete tag pair
    for (const tag of overlappingTags) {
      if (tag.isOpen) {
        // Find the matching closing tag
        const closingTag = tagPositions.find(
          (t) => !t.isOpen && t.name === tag.name && t.start > tag.start
        );
        if (closingTag && start === tag.start && end >= closingTag.end) {
          return [start, end];
        }
      }
    }

    // Check if selection spans multiple separate tags (should not adjust)
    const openTags = overlappingTags.filter((tag) => tag.isOpen);
    const closeTags = overlappingTags.filter((tag) => !tag.isOpen);

    // If we have multiple separate tag pairs, don't adjust
    if (openTags.length > 1 || closeTags.length > 1) {
      // Check if they are separate (not nested)
      let isSeparate = true;
      for (let i = 0; i < openTags.length - 1; i++) {
        for (let j = i + 1; j < openTags.length; j++) {
          if (openTags[i].start < openTags[j].start && openTags[j].end < openTags[i].end) {
            isSeparate = false;
            break;
          }
        }
        if (!isSeparate) break;
      }

      if (isSeparate) {
        return [start, end];
      }
    }

    // Find the innermost overlapping tag (the one with the smallest range that still overlaps)
    const innermostTag = overlappingTags.reduce((min, current) => {
      const currentRange = current.end - current.start;
      const minRange = min.end - min.start;
      return currentRange < minRange ? current : min;
    });

    // Determine the best adjustment based on the innermost tag
    let newStart = start;
    let newEnd = end;

    // If selection starts before the tag and ends after the tag starts
    if (start <= innermostTag.start && end > innermostTag.start && end <= innermostTag.end) {
      // Move start to after the tag (exclude the tag)
      newStart = innermostTag.end;
    }
    // If selection starts with the tag and extends beyond it
    else if (start === innermostTag.start && end > innermostTag.end) {
      // Move start to after the opening tag
      newStart = innermostTag.end;
    }
    // If selection starts before the tag ends and ends after the tag
    else if (start >= innermostTag.start && start < innermostTag.end && end >= innermostTag.end) {
      // Move end to before the tag (exclude the tag)
      newEnd = innermostTag.start;
    }
    // If selection is completely inside the tag
    else if (start >= innermostTag.start && end <= innermostTag.end) {
      // Move start to after the opening tag and end to before the closing tag
      if (innermostTag.isOpen) {
        // This is an opening tag, find its closing tag
        const closingTag = tagPositions.find(
          (t) => !t.isOpen && t.name === innermostTag.name && t.start > innermostTag.start
        );
        if (closingTag) {
          newStart = innermostTag.end;
          newEnd = closingTag.start;
        }
      } else {
        // This is a closing tag, find its opening tag
        const openingTag = tagPositions.find(
          (t) => t.isOpen && t.name === innermostTag.name && t.start < innermostTag.start
        );
        if (openingTag) {
          newStart = openingTag.end;
          newEnd = innermostTag.start;
        }
      }
    }

    // Additional logic: If the selection includes closing tags before the innermost tag,
    // move the start to exclude them
    if (newStart === start && newEnd === end) {
      // Find closing tags that are before the innermost tag and within our selection
      for (const tag of overlappingTags) {
        if (!tag.isOpen && tag.end <= innermostTag.start && tag.start >= start) {
          // This is a closing tag before the innermost tag, move start past it
          newStart = Math.max(newStart, tag.end);
        }
      }
    }

    // Special case: If the selection starts with a closing tag and ends with a complete tag pair,
    // move the start to exclude the closing tag
    if (newStart === start && newEnd === end) {
      // Check if selection starts with a closing tag
      const startingClosingTag = overlappingTags.find((tag) => !tag.isOpen && tag.start === start);

      if (startingClosingTag) {
        // Check if the end matches a complete tag pair
        const endingTag = overlappingTags.find(
          (tag) => tag.isOpen && tag.start < end && tag.end === end
        );

        if (endingTag) {
          // Find the matching closing tag for the ending tag
          const matchingClosingTag = tagPositions.find(
            (t) => !t.isOpen && t.name === endingTag.name && t.start > endingTag.start
          );

          if (matchingClosingTag && matchingClosingTag.end === end) {
            // This is a complete tag pair at the end, move start past the closing tag
            newStart = startingClosingTag.end;
          }
        }
      }
    }

    // Additional logic: If the selection extends beyond content, contract it to content boundaries
    // This handles cases where selection goes beyond the actual content
    if (newStart === start && newEnd === end) {
      // Try to find the content boundaries within the selection
      let contentStart = start;
      let contentEnd = end;

      // Find the rightmost opening tag within our selection
      for (const tag of tagPositions) {
        if (tag.isOpen && tag.start >= start && tag.start < end) {
          contentStart = Math.max(contentStart, tag.end);
        }
      }

      // Find the leftmost closing tag within our selection
      for (const tag of tagPositions) {
        if (!tag.isOpen && tag.end > start && tag.end <= end) {
          contentEnd = Math.min(contentEnd, tag.start);
        }
      }

      // If we found valid content boundaries, use them
      if (contentStart < contentEnd && contentStart >= start && contentEnd <= end) {
        newStart = contentStart;
        newEnd = contentEnd;
      }
    }

    // Ensure the new range is valid
    if (newStart >= newEnd) {
      return [start, end]; // Return original if adjustment would be invalid
    }

    return [clamp(newStart), clamp(newEnd)];
  }

  /**
   * Validate anchors and return asymmetrical (broken) anchors
   */
  validateAnchors() {
    return this.text.validateAnchors();
  }

  /**
   * Resolve a validated asymmetrical-anchor issue back to its concrete Tag.
   * Identity is (tagName, position, segmentIndex): `position` is a per-segment
   * raw offset and is NOT unique across segments, so segmentIndex is required
   * to avoid resolving the wrong orphan when the same entity is broken at the
   * same offset in different segments.
   */
  private findAsymmetricalTag(
    tagName: string,
    position: number,
    segmentIndex: number
  ): { tag: Tag; issue: AsymmetricalAnchor } | undefined {
    const issue = this.validateAnchors().find(
      (i) => i.tagName === tagName && i.position === position && i.segmentIndex === segmentIndex
    );
    if (!issue) {
      return undefined;
    }

    const segment = this.text.segments[issue.segmentIndex];
    if (!segment) {
      return undefined;
    }

    const tags = issue.type === "orphaned-opening" ? segment.openingTags : segment.closingTags;
    const tag = tags.find((t) => t.getTagName() === tagName && t.position === issue.position);

    return tag ? { tag, issue } : undefined;
  }

  /**
   * Shared scroll tail: place the caret at the given absolute raw-text index,
   * scroll it into view, redraw and focus the canvas.
   */
  private scrollCaretToRawIndex(absRaw: number): void {
    const segPos = this.text.getSegmentFromAbsTextIndex(absRaw);
    if (!segPos) {
      return;
    }
    const targetSegment = this.text.segments[segPos.segmentIndex];
    if (!targetSegment) {
      return;
    }

    const absYLine = targetSegment.lineStart + segPos.lineIndex;
    this.viewport.scrollTo(absYLine, this.scrollExtentLineCount());
    this.cursor.xLine = segPos.charInLineIndex;
    this.cursor.yLine = absYLine;
    this.cursor.resetHighlight();
    this.draw();
    this.element.focus({ preventScroll: true });
  }

  /**
   * Remove an asymmetrical (broken) anchor identified by tag name, per-segment
   * position and segment index. Returns true if successfully removed.
   */
  removeAsymmetricalAnchor(tagName: string, position: number, segmentIndex: number): boolean {
    const found = this.findAsymmetricalTag(tagName, position, segmentIndex);
    if (!found) {
      return false;
    }

    const { tag: tagToRemove, issue } = found;
    const segment = this.text.segments[issue.segmentIndex];
    if (!segment) {
      return false;
    }

    // Remove from raw text
    const tagLength = tagToRemove.getTagLength();
    const before = segment.raw.substring(0, tagToRemove.position);
    const after = segment.raw.substring(tagToRemove.position + tagLength);
    segment.raw = before + after;

    // Re-parse the segment
    segment.parseText();

    // Update text value and recalculate
    this.text.assignValueFromSegments();

    // Redraw
    this.draw();

    // Re-check anchors
    this.checkAnchors();

    return true;
  }

  /**
   * Scroll the viewport to an asymmetrical (broken) anchor's tag. Works for
   * both orphaned opening and orphaned closing tags. Intended to be used in RAW
   * mode, where the tag markup is visible and line positions match raw text.
   */
  scrollToAsymmetricalAnchor(tagName: string, position: number, segmentIndex: number): void {
    const found = this.findAsymmetricalTag(tagName, position, segmentIndex);
    if (!found) {
      return;
    }
    this.scrollCaretToRawIndex(found.tag.getAbsoluteTagPosition(this.text.segments));
  }

  /**
   * Check anchors and emit warnings if issues found
   */
  checkAnchors(): void {
    const issues = this.validateAnchors();
    if (issues.length > 0) {
      this.warnings.emitAsymmetricalAnchors(issues);
    } else {
      this.warnings.clearWarnings();
      this.warnings.emitAsymmetricalAnchors([]);
    }
  }

  /**
   * Run all warning detection checks. Invoked on every text mutation.
   * Add new check calls here when introducing additional warning types.
   */
  private runWarningChecks(): void {
    this.checkAnchors();
  }
}
