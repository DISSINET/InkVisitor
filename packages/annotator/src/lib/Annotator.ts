import Cursor, { DIRECTION } from "./Cursor";
import Highlighter, { IAbsCoordinates, CursorStyle } from "./Highlighter";
import Keys from "./Keys";
import { Lines } from "./Lines";
import Scroller from "./Scroller";
import Text, { Tag, SegmentPosition } from "./Text";
import Viewport from "./Viewport";
import { Warnings } from "./warnings";
import {
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  EditMode,
  HighlightMode,
  HOVER_DEBOUNCE_MS,
  LINE_HEIGHT,
  SELECTION_EDGE_SCROLL_SPEED,
  VIEWPORT_END_BUFFER_ROWS,
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

// Opening tag with specific name and optional attributes: <tagname attr="value"> or <tagname>
export const createSpecificOpeningTagRegex = (tagName: string) =>
  new RegExp(`<${tagName}(?:\\s+[^>]*)?>`, "g");

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

// DrawingOptions bundles required sizes shared by multiple components while drawing into canvas
export interface DrawingOptions {
  charWidth: number;
  lineHeight: number;
  charsAtLine: number;
  color?: string; // override
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

  // TODO: different font, different sizes
  font: string = `${DEFAULT_FONT_SIZE}px ${DEFAULT_FONT}`;

  fontColor: string = "black";
  bgColor: string = "white";
  selectColor: string = "rgba(0, 0, 0)";
  selectOpacity: number = 0.5;

  charWidth: number = 0;
  lineHeight: number = LINE_HEIGHT;

  inputText: string = "";

  // size for virtual area inside the canvas element
  width: number = 0;
  height: number = 0;

  // components here
  viewport: Viewport;
  cursor: Cursor;
  hoverHighlighter: Highlighter; // For statement list hover interaction
  text: Text;
  scroller?: Scroller;
  lines?: Lines;
  keys: Keys;
  warnings: Warnings;

  annotatedPosition: SegmentPosition | null = null;

  // to control highlightChangeCb callback
  lastSelectedText?: Selected;
  ratio: number = 1;

  previousRenderViewportLineStart: number;

  private lastSelectPointer: { cx: number; cy: number } | null = null;

  private selectionScrollRaf: number = 0;

  // callbacks
  onSelectTextCb?: (text: Selected) => void;
  onHighlightCb?: (entityId: string) => HighlightSchema | void;
  onTextChangeCb?: (text: string) => void;
  onScrollCb?: (line: number) => void;
  onAnchorHoverCb?: (tags: Tag[]) => void; // Part 2 of #2835
  onAnchorTagHoverCb?: (
    tag: Tag | null,
    position: { x: number; y: number } | null
  ) => void;

  clickCount: number;
  clickTimeout?: NodeJS.Timeout;
  hoverDebounceTimeout?: NodeJS.Timeout; // For debouncing mousemove events

  private readonly boundOnMouseMove = (e: MouseEvent) => this.onMouseMove(e);

  private readonly boundOnCanvasMouseLeave = () => {
    if (this.hoverDebounceTimeout) {
      clearTimeout(this.hoverDebounceTimeout);
      this.hoverDebounceTimeout = undefined;
    }
    this.onAnchorHoverCb?.([]);
    this.onAnchorTagHoverCb?.(null, null);
  };

  constructor(
    element: HTMLCanvasElement,
    inputText: string,
    ratio: number = 1
  ) {
    this.element = element;
    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context");
    }

    this.ratio = ratio;
    this.font = `${DEFAULT_FONT_SIZE * this.ratio}px ${DEFAULT_FONT}`;

    this.lineHeight = LINE_HEIGHT * this.ratio;

    this.ctx = ctx;
    this.width =
      Number(this.element.style.width.replace("px", "")) * this.ratio;
    this.height =
      Number(this.element.style.height.replace("px", "")) * this.ratio;

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
    this.element.addEventListener(
      "dblclick",
      this.onMouseDoubleClick.bind(this)
    );
    this.element.addEventListener("mousemove", this.boundOnMouseMove);
    this.element.addEventListener("mouseleave", this.boundOnCanvasMouseLeave);

    this.clickCount = 0;

    this.previousRenderViewportLineStart = 0;

    this.draw();

    setTimeout(() => {
      this.resize();
    });
  }

  setSelectStyle(
    selectColor: string,
    selectOpacity: number,
    selectorColor: string
  ) {
    this.selectColor = selectColor;
    this.selectOpacity = selectOpacity;

    this.cursor.style = {
      color: this.selectColor,
      opacity: this.selectOpacity,
      selectorColor: selectorColor,
    } as CursorStyle;
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
        closeSeg.raw.slice(0, closePos) +
        closeSeg.raw.slice(closePos + closeTag.getTagLength());
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
    if (
      hasSelection &&
      oldStartIndex !== undefined &&
      oldEndIndex !== undefined
    ) {
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
      const newStartSegPos =
        this.text.getSegmentFromAbsTextIndex(newStartIndex);
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

    this.warnings.onTextChanged(this.text.value);
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

    // Find all opening tags with this tag name across all segments
    const matchingTags: Tag[] = [];
    for (const segment of this.text.segments) {
      const foundTags = segment.openingTags.filter(
        (tag) => tag.getTagName() === tagName
      );
      matchingTags.push(...foundTags);
    }

    if (matchingTags.length === 0) {
      this.clearHoverHighlight();
      return;
    }

    // For each opening tag, pair with the correct closing tag (depth-aware), same as
    // detectAndEmitAnchorHover. Raw content span: [openEnd, closeStart) — see Tag docs in Text.
    let minStartLine = Infinity;
    let minStartChar = Infinity;
    let maxEndLine = -Infinity;
    let maxEndExclusiveChar = -Infinity;

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
      const endExclusiveChar = lastSegPos.charInLineIndex + 1;

      if (
        startLine < minStartLine ||
        (startLine === minStartLine && startChar < minStartChar)
      ) {
        minStartLine = startLine;
        minStartChar = startChar;
      }
      if (
        endLine > maxEndLine ||
        (endLine === maxEndLine && endExclusiveChar > maxEndExclusiveChar)
      ) {
        maxEndLine = endLine;
        maxEndExclusiveChar = endExclusiveChar;
      }
    }

    // Highlighter uses exclusive end xLine on the last line (see Highlighter.draw).
    if (minStartLine === Infinity || maxEndLine === -Infinity) {
      this.clearHoverHighlight();
      return;
    }

    this.hoverHighlighter.selectStart = {
      xLine: minStartChar,
      yLine: minStartLine,
    };
    this.hoverHighlighter.selectEnd = {
      xLine: maxEndExclusiveChar,
      yLine: maxEndLine,
    };
    this.draw();
  }

  /**
   * Clears the hover highlight (for statement list hover interaction).
   */
  clearHoverHighlight() {
    this.hoverHighlighter.reset();
    this.draw();
  }

  /**
   * Finds the matching closing tag for an opening tag using depth-aware pairing.
   *
   * @param openTag - Opening tag to match
   * @returns Matching closing tag with its segment index, or null
   */
  private findMatchingClosingTag(
    openTag: Tag
  ): { closeTag: Tag; closeSegIdx: number } | null {
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
      this.viewport.lineStart
    );

    // Clamp to valid line range
    tempCursor.yLine = Math.max(
      0,
      Math.min(tempCursor.yLine, Math.max(0, this.text.noLines - 1))
    );

    // Get segment position at cursor
    const segmentPos = this.text.getSegmentPosition(
      tempCursor.yLine,
      tempCursor.xLine
    );

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
        const closeAbsRawStart = match.closeTag.getAbsoluteTagPosition(
          this.text.segments
        );
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
   * Only meaningful in RAW mode since HIGHLIGHT mode hides tag markup.
   */
  private detectAndEmitAnchorTagHover(e: MouseEvent) {
    if (!this.onAnchorTagHoverCb) {
      return;
    }

    const tempCursor = new Cursor(this.ratio, 0, 0);
    tempCursor.setPositionFromEvent(
      e,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart
    );

    tempCursor.yLine = Math.max(
      0,
      Math.min(tempCursor.yLine, Math.max(0, this.text.noLines - 1))
    );

    const segmentPos = this.text.getSegmentPosition(
      tempCursor.yLine,
      tempCursor.xLine
    );

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

        const closeStart = match.closeTag.getAbsoluteTagPosition(
          this.text.segments
        );
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
    this.width =
      Number(this.element.style.width.replace("px", "")) * this.ratio;
    this.height =
      Number(this.element.style.height.replace("px", "")) * this.ratio;

    this.element.width = this.width;
    this.element.height = this.height;

    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    const noLinesViewport = this.viewportFullRowCount() + 1;
    const charsAtLine = Math.floor(this.width / this.charWidth);

    const extent = this.scrollExtentLineCount();
    const positionBeforeRel =
      extent > 0 ? this.viewport.lineStart / Math.max(1, extent) : 0;

    this.viewport.updateLineEnd(noLinesViewport);
    this.text.updateCharsAtLine(charsAtLine);

    // this function tries to keep the same relative position of the text even its not perfect
    // FIXME: Ideally we should find the exact text at the top of the viewport and try to keep it on top after the resize
    this.viewport.scrollTo(
      Math.floor(positionBeforeRel * this.scrollExtentLineCount()),
      this.scrollExtentLineCount()
    );

    this.scroller?.setRunnerSize(
      (this.viewport.noLines / this.scrollExtentLineCount()) * 100
    );

    this.scroller?.setViewportSize(
      Math.min(
        100,
        (this.viewport.noLines / this.scrollExtentLineCount()) * 100
      )
    );

    this.draw();
  }

  resize(): void {
    this.onCanvasResize();
  }

  onHighlight(cb: (entityId: string) => HighlightSchema | void): void {
    this.onHighlightCb = cb;
  }

  onTextChanged(cb: (text: string) => void): void {
    this.onTextChangeCb = cb;
  }

  onWarning(cb: (message: string) => void): void {
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
  onAnchorTagHover(
    cb: (tag: Tag | null, position: { x: number; y: number } | null) => void
  ) {
    this.onAnchorTagHoverCb = cb;
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
      this.viewport.lineStart
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

    this.cursor.selectArea();
  }

  private cancelSelectionEdgeScroll() {
    if (this.selectionScrollRaf) {
      cancelAnimationFrame(this.selectionScrollRaf);
      this.selectionScrollRaf = 0;
    }
  }

  private readonly tickSelectionEdgeScroll = () => {
    this.selectionScrollRaf = 0;
    if (!this.cursor.isSelecting() || !this.lastSelectPointer) {
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
      this.viewport.addScrollOffset(
        -speed,
        this.lineHeight,
        this.scrollExtentLineCount()
      );
    } else if (inBottomZone) {
      this.viewport.addScrollOffset(
        speed,
        this.lineHeight,
        this.scrollExtentLineCount()
      );
    }

    const scrolled =
      this.viewport.lineStart !== lineStartBefore ||
      this.viewport.scrollOffsetY !== scrollOffBefore;

    if (scrolled) {
      this.applyPointerToCursor(
        this.lastSelectPointer.cx,
        this.lastSelectPointer.cy
      );
      this.draw();
    }

    const inZone = inTopZone || inBottomZone;
    if (
      this.cursor.isSelecting() &&
      this.lastSelectPointer &&
      inZone &&
      scrolled
    ) {
      this.selectionScrollRaf = requestAnimationFrame(
        this.tickSelectionEdgeScroll
      );
    }
  };

  private ensureSelectionEdgeScrollRunning() {
    if (!this.lastSelectPointer || !this.cursor.isSelecting()) {
      return;
    }
    if (this.selectionScrollRaf) {
      return;
    }
    const rect = this.element.getBoundingClientRect();
    const cy = this.lastSelectPointer.cy;
    if (cy < rect.top || cy > rect.bottom) {
      this.selectionScrollRaf = requestAnimationFrame(
        this.tickSelectionEdgeScroll
      );
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
    this.lastSelectPointer = { cx: e.clientX, cy: e.clientY };
    this.applyPointerToCursor(e.clientX, e.clientY);

    this.annotatedPosition = this.text.cursorToIndex(
      this.viewport,
      this.cursor
    );

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

  /**
   * onMouseMove is handler for moving mouse-event
   * @param e
   */
  onMouseMove(e: MouseEvent) {
    if (this.cursor.isSelecting()) {
      this.onDocumentSelectMove(e);
    }

    // Part 2 of #2835: Detect anchors at hover position
    if (
      (this.onAnchorHoverCb || this.onAnchorTagHoverCb) &&
      !this.cursor.isSelecting()
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
    this.cursor.setPositionFromEvent(
      e,
      this.lineHeight,
      this.charWidth,
      this.viewport.scrollOffsetY,
      this.viewport.lineStart
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

    const [offsetLeft, offsetRight] = this.text.getCursorWordOffsets(
      this.viewport,
      this.cursor
    );
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
    this.draw();
  }

  /**
   * onWheel is handler for mouse-wheel-event. Uses fluent scroll: accumulates deltaY
   * so text and line numbers scroll smoothly together.
   * @param e
   */
  onWheel(e: WheelEvent) {
    const deltaBufferPx = e.deltaY * this.ratio;
    this.viewport.addScrollOffset(
      deltaBufferPx,
      this.lineHeight,
      this.scrollExtentLineCount()
    );

    e.preventDefault();
    this.draw();
  }

  addLines(canvasElement: HTMLCanvasElement): void {
    this.lines = new Lines(
      canvasElement,
      this.ratio,
      this.lineHeight,
      this.charWidth
    );
  }

  getAnnotations(
    start: SegmentPosition | null,
    end: SegmentPosition | null
  ): Tag[] {
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
    const findClosestOpeningTag = (
      tagName: string,
      beforeAbsolutePosition: number
    ): Tag | null => {
      let closestTag: Tag | null = null;
      let closestDistance = Infinity;

      for (let i = 0; i <= end!.segmentIndex; i++) {
        const segment = this.text.segments[i];
        for (const tag of segment.openingTags) {
          const tagAbsolutePosition = getAbsoluteTextIndex(tag);
          if (
            tag.getTagName() === tagName &&
            tagAbsolutePosition < beforeAbsolutePosition
          ) {
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
            (stackTag) =>
              stackTag.getTagName() === tag.getTagName() && !stackTag.closing
          );

          if (matchingIndex !== -1) {
            const matchedOpeningTag = tagStack[matchingIndex];
            closingToOpeningMap.set(tag, matchedOpeningTag);
            tagStack.splice(matchingIndex, 1);

            const closingTagInSelection =
              (i > start.segmentIndex ||
                (i === start.segmentIndex &&
                  tag.position >= start.rawTextIndex)) &&
              (i < end.segmentIndex ||
                (i === end.segmentIndex && tag.position < end.rawTextIndex));

            const openingTagOpenedBeforeEnd =
              matchedOpeningTag.segmentIndex < end.segmentIndex ||
              (matchedOpeningTag.segmentIndex === end.segmentIndex &&
                matchedOpeningTag.position < end.rawTextIndex);

            const shouldIncludeOpeningTag =
              closingTagInSelection ||
              (openingTagOpenedBeforeEnd &&
                (i > start.segmentIndex ||
                  (i === start.segmentIndex &&
                    tag.position >= start.rawTextIndex)));

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
              (i === start.segmentIndex &&
                tag.position >= start.rawTextIndex)) &&
            (i < end.segmentIndex ||
              (i === end.segmentIndex && tag.position < end.rawTextIndex));
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
        (unclosedTag.segmentIndex === end.segmentIndex &&
          unclosedTag.position < end.rawTextIndex);

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
            const closestOpening = findClosestOpeningTag(
              tag.getTagName(),
              tagAbsolutePosition
            );
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

    // Sort tags by their absolute position for consistent ordering
    return processedFinalTags.sort((a, b) => {
      // Use the segmentIndex from the tags
      const aSegmentIndex = a.segmentIndex;
      const bSegmentIndex = b.segmentIndex;

      const aAbsolutePosition =
        aSegmentIndex !== -1 ? getAbsoluteTextIndex(a) : a.position;
      const bAbsolutePosition =
        bSegmentIndex !== -1 ? getAbsoluteTextIndex(b) : b.position;

      return aAbsolutePosition - bAbsolutePosition;
    });
  }

  /**
   * addScroller adds optional Scroller component to stack
   * @param e
   */
  addScroller(scrollerDiv: HTMLDivElement) {
    this.scroller = new Scroller(scrollerDiv);
    this.scroller.setFocusTarget(this.element);
    this.scroller.onChange((percentage: number) => {
      const viewportLines = this.viewport.lineEnd - this.viewport.lineStart;
      const scrollableLines = Math.max(
        0,
        this.scrollExtentLineCount() - viewportLines
      );
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
    this.scroller?.setRunnerSize(
      (this.viewport.noLines / this.scrollExtentLineCount()) * 100
    );

    const viewportSize = this.viewport.noLines / this.scrollExtentLineCount();
    this.scroller?.setViewportSize(Math.min(100, viewportSize * 100));
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
    const gutterCssW =
      parseCssPx(lineEl.style.width) || lineEl.clientWidth || 50;

    if (mainEl.style.height) {
      lineEl.style.height = mainEl.style.height;
    }

    const scale =
      mainEl.width > 0 && mainCssW > 0 ? mainEl.width / mainCssW : this.ratio;
    const nextW = Math.max(1, Math.round(gutterCssW * scale));
    const nextH =
      mainEl.height > 0
        ? mainEl.height
        : Math.max(
            1,
            Math.round(
              (parseCssPx(mainEl.style.height) || mainEl.clientHeight) *
                this.ratio
            )
          );

    if (lineEl.width !== nextW || lineEl.height !== nextH) {
      lineEl.width = nextW;
      lineEl.height = nextH;
    }
  }

  /**
   * draw resets the canvas and redraws the scene anew.
   * First draw lines with text, then allow each component to draw their own logic.
   * TODO - this should be done in conjunction with requestAnimationFrame
   */
  draw() {
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

    if (textSegment) {
      const line = this.text.getLineFromPosition(textSegment);
      if (this.cursor.xLine > line.length) {
        this.cursor.fixOutOfBounds(this.viewport, this.text);
      }

      this.cursor.draw(this.ctx, this.viewport, this.text, {
        lineHeight: this.lineHeight,
        charWidth: this.charWidth,
        charsAtLine: this.text.charsAtLine,
      });
    }

    // Draw hover highlight for statement list interaction (#2835)
    this.hoverHighlighter.draw(this.ctx, this.viewport, this.text, {
      lineHeight: this.lineHeight,
      charWidth: this.charWidth,
      charsAtLine: this.text.charsAtLine,
    });

    // if (this.onSelectTextCb && this.cursor.isSelected()) {
    if (this.onSelectTextCb) {
      const [start, end] = this.cursor.getAbsBounds();
      if (
        start &&
        end &&
        (start.xLine !== end.xLine || start?.yLine !== end?.yLine)
      ) {
        const startSegment = this.text.getSegmentPosition(
          start.yLine,
          start.xLine
        ) as SegmentPosition;
        const endSegment = this.text.getSegmentPosition(
          end.yLine,
          end.xLine
        ) as SegmentPosition;
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
      const startPos = this.text.getSegmentPosition(
        this.viewport.lineStart,
        0,
        true
      );
      const endPos = this.text.getSegmentPosition(
        this.viewport.lineEnd,
        this.text.charsAtLine
      );

      const annotated: Tag[] = this.getAnnotations(startPos, endPos);
      const higlightItems: {
        schema: HighlightSchema;
        start: IAbsCoordinates;
        end: IAbsCoordinates;
      }[] = [];
      const processedTagNames = new Set<string>();
      for (const tag of annotated) {
        const tagName = tag.getTagName();
        if (processedTagNames.has(tagName)) {
          continue;
        }
        processedTagNames.add(tagName);
        const hlSchema = this.onHighlightCb(tagName);
        if (hlSchema) {
          let occurence: IAbsCoordinates[];
          let i = 0;
          do {
            occurence = this.text.getTagPosition(tagName, i);
            if (occurence.length > 1) {
              higlightItems.push({
                schema: hlSchema,
                start: occurence[0],
                end: occurence[1],
              });
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
        });
      }
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
  }

  /**
   * change display mode and recalculate drawn lines
   * @param mode
   */
  setMode(mode: EditMode) {
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
        Math.min(
          absLine,
          Math.max(0, this.scrollExtentLineCount() - 1 - this.viewport.noLines)
        )
      );
      this.viewport.scrollOffsetY = scrollOffsetBefore;
    }

    if (absIndex !== null && absIndex >= 0) {
      const segPos = this.text.getSegmentFromAbsTextIndex(absIndex);
      if (segPos !== null) {
        const coords = this.text.positionToCursor(this.viewport, segPos);
        if (coords !== null) {
          const absY = this.viewport.lineStart + coords.yLine;
          this.cursor.setPosition(coords.xLine, absY);
          if (
            absY < this.viewport.lineStart ||
            absY > this.viewport.lineEnd - 1
          ) {
            this.viewport.scrollTo(absY, this.scrollExtentLineCount());
          }
        }
      }
    }
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
        minTagStart <= maxTagEnd &&
        indexStart <= minTagStart &&
        indexEnd >= maxTagEnd;
      if (selectionEncompassesAllTags) {
        if (indexStart === 0) {
          indexEnd = raw.length;
        }
      } else {
        [indexStart, indexEnd] = this.sanitizeEnvelopeRange(
          indexStart,
          indexEnd
        );
      }

      // could be '<tag>text .... text</tag> (closing tag always included if present)
      const selectedRawText = this.text.value.slice(indexStart, indexEnd);
      const beforeText = this.text.value.slice(0, indexStart);
      const afterText = this.text.value.slice(indexEnd);

      const openTagString = openTag.getTag();
      const closeTagString = closeTag.getTag();

      this.text.value =
        beforeText +
        openTagString +
        selectedRawText +
        closeTagString +
        afterText;

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

      this.warnings.onTextChanged(this.text.value);
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
    this.warnings.onTextChanged(this.text.value);
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

    const contentStartAbsRaw =
      openingTag.getAbsoluteTagPosition(this.text.segments) +
      openingTag.getTagLength();
    const segPos = this.text.getSegmentFromAbsTextIndex(contentStartAbsRaw);
    if (!segPos) {
      return;
    }

    const segment = this.text.segments[segPos.segmentIndex];
    if (!segment) {
      return;
    }

    const absYLine = segment.lineStart + segPos.lineIndex;

    this.viewport.scrollTo(absYLine, this.scrollExtentLineCount());
    this.cursor.xLine = segPos.charInLineIndex;
    this.cursor.yLine = absYLine;
    this.cursor.resetHighlight();
    this.draw();
    this.element.focus({ preventScroll: true });
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
   * Scrolls the viewport so that the given raw text character index is at the top of the visible area.
   */
  scrollToRawPosition(rawIndex: number): void {
    const pos = this.text.getSegmentFromAbsTextIndex(rawIndex);
    if (!pos) return;
    const segment = this.text.segments[pos.segmentIndex];
    const absLine = segment.lineStart + pos.lineIndex;
    this.viewport.scrollTo(absLine, this.scrollExtentLineCount());
    this.draw();
  }

  updateText(newText: string) {
    const positionBeforeChange = this.viewport.lineStart;
    const scrollOffsetBeforeChange = this.viewport.scrollOffsetY;

    this.text.value = newText;
    this.text.prepareSegments();
    this.text.calculateLines();
    this.warnings.onTextChanged(this.text.value);

    // Preserve fluent scroll offset (deltaY) so updating text (e.g. discard)
    // doesn't snap the viewport to the top of a line.
    const maxLineStart = Math.max(
      0,
      this.scrollExtentLineCount() - 1 - this.viewport.noLines
    );
    const clampedLineStart = Math.max(
      0,
      Math.min(positionBeforeChange, maxLineStart)
    );
    const desiredLineStart =
      clampedLineStart + (scrollOffsetBeforeChange || 0) / this.lineHeight;

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
  search(
    toFind: string,
    isRegex: boolean = false,
    isCaseSensitive: boolean = true
  ): Occurrence[] {
    const occurrences = [];
    const normalizedTerm = isCaseSensitive ? toFind : toFind.toLowerCase();

    const collectLiteralOccurrences = (
      line: string,
      segmentIndex: number,
      lineIndex: number
    ) => {
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
            collectLiteralOccurrences(
              line,
              parseInt(segmentI, 10),
              parseInt(lineI, 10)
            );
          }
        } else {
          collectLiteralOccurrences(
            line,
            parseInt(segmentI, 10),
            parseInt(lineI, 10)
          );
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
    const absY =
      this.text.segments[occurence.segmentIndex].lineStart +
      occurence.lineIndex;
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
        const endSegment = this.text.getSegmentPosition(
          end.yLine,
          end.xLine
        ) as SegmentPosition;
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

  onCopyText() {
    window.navigator.clipboard.writeText(this.lastSelectedText?.text || "");
  }

  onPasteText() {
    window.navigator.clipboard
      .readText()
      .then((clipText: string) => {
        const area = this.cursor.getSelectedArea();
        if (area) {
          this.text.deleteRangeText(area[0], area[1]);
          this.cursor.reset();
          this.cursor.setPosition(area[0].xLine, area[0].yLine);
        }
        this.text.insertText(this.viewport, this.cursor, clipText);
        this.cursor.move(clipText.length, 0);
        this.cursor.fixOutOfBounds(this.viewport, this.text);

        this.warnings.onTextChanged(this.text.value);
        this.draw();
      })
      .catch((err) => {
        console.error("Error reading clipboard", err);
      });
  }

  onReplaceText(text: string) {
    const area = this.cursor.getSelectedArea();
    if (area) {
      this.text.deleteRangeText(area[0], area[1]);
      this.cursor.reset();
      this.cursor.setPosition(area[0].xLine, area[0].yLine);
    }
    this.text.insertText(this.viewport, this.cursor, text);
    this.cursor.move(text.length, 0);
    this.cursor.fixOutOfBounds(this.viewport, this.text);

    this.warnings.onTextChanged(this.text.value);
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
  private sanitizeEnvelopeRange(
    indexStart: number,
    indexEnd: number
  ): [number, number] {
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
      const openingRegex = new RegExp(
        openingTagRegex.source,
        openingTagRegex.flags
      );
      const closingRegex = new RegExp(
        closingTagRegex.source,
        closingTagRegex.flags
      );

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
        return (
          closingTag != null && start <= tag.start && end >= closingTag.end
        );
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
        if (
          contentStart < contentEnd &&
          contentStart >= start &&
          contentEnd <= end
        ) {
          return [clamp(contentStart), clamp(contentEnd)];
        }
      }

      return [start, end];
    }

    // Find tags that overlap with our selection
    const overlappingTags = tagPositions.filter(
      (tag) => tag.start < end && tag.end > start
    );

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
          (t) =>
            !t.isOpen &&
            t.name === nextOpeningTag.name &&
            t.start > nextOpeningTag.start
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
      const closingTagsAtEnd = overlappingTags.filter(
        (tag) => !tag.isOpen && tag.end === end
      );

      if (closingTagsAtEnd.length > 0) {
        // Find the leftmost closing tag at the end
        const leftmostClosingTagAtEnd = closingTagsAtEnd.reduce(
          (min, current) => (current.start < min.start ? current : min)
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
          .reduce(
            (closest, current) =>
              current.start > closest.start ? current : closest,
            { start: -1, end: -1, name: "", isOpen: false }
          );

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
          if (
            openTags[i].start < openTags[j].start &&
            openTags[j].end < openTags[i].end
          ) {
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
    if (
      start <= innermostTag.start &&
      end > innermostTag.start &&
      end <= innermostTag.end
    ) {
      // Move start to after the tag (exclude the tag)
      newStart = innermostTag.end;
    }
    // If selection starts with the tag and extends beyond it
    else if (start === innermostTag.start && end > innermostTag.end) {
      // Move start to after the opening tag
      newStart = innermostTag.end;
    }
    // If selection starts before the tag ends and ends after the tag
    else if (
      start >= innermostTag.start &&
      start < innermostTag.end &&
      end >= innermostTag.end
    ) {
      // Move end to before the tag (exclude the tag)
      newEnd = innermostTag.start;
    }
    // If selection is completely inside the tag
    else if (start >= innermostTag.start && end <= innermostTag.end) {
      // Move start to after the opening tag and end to before the closing tag
      if (innermostTag.isOpen) {
        // This is an opening tag, find its closing tag
        const closingTag = tagPositions.find(
          (t) =>
            !t.isOpen &&
            t.name === innermostTag.name &&
            t.start > innermostTag.start
        );
        if (closingTag) {
          newStart = innermostTag.end;
          newEnd = closingTag.start;
        }
      } else {
        // This is a closing tag, find its opening tag
        const openingTag = tagPositions.find(
          (t) =>
            t.isOpen &&
            t.name === innermostTag.name &&
            t.start < innermostTag.start
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
        if (
          !tag.isOpen &&
          tag.end <= innermostTag.start &&
          tag.start >= start
        ) {
          // This is a closing tag before the innermost tag, move start past it
          newStart = Math.max(newStart, tag.end);
        }
      }
    }

    // Special case: If the selection starts with a closing tag and ends with a complete tag pair,
    // move the start to exclude the closing tag
    if (newStart === start && newEnd === end) {
      // Check if selection starts with a closing tag
      const startingClosingTag = overlappingTags.find(
        (tag) => !tag.isOpen && tag.start === start
      );

      if (startingClosingTag) {
        // Check if the end matches a complete tag pair
        const endingTag = overlappingTags.find(
          (tag) => tag.isOpen && tag.start < end && tag.end === end
        );

        if (endingTag) {
          // Find the matching closing tag for the ending tag
          const matchingClosingTag = tagPositions.find(
            (t) =>
              !t.isOpen &&
              t.name === endingTag.name &&
              t.start > endingTag.start
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
      if (
        contentStart < contentEnd &&
        contentStart >= start &&
        contentEnd <= end
      ) {
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
}
