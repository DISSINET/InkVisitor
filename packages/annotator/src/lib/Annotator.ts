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
  LINE_HEIGHT,
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

  // callbacks
  onSelectTextCb?: (text: Selected) => void;
  onHighlightCb?: (entityId: string) => HighlightSchema | void;
  onTextChangeCb?: (text: string) => void;
  onScrollCb?: (line: number) => void;

  clickCount: number;
  clickTimeout?: NodeJS.Timeout;

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

    const noLinesViewport = Math.ceil(this.height / this.lineHeight) - 1;

    this.viewport = new Viewport(0, noLinesViewport);

    this.inputText = inputText;
    this.text = new Text(this.inputText, charsAtLine);

    this.cursor = new Cursor(this.ratio, 0, 0);

    this.keys = new Keys(this);
    this.warnings = new Warnings();

    this.bgColor = this.element.style.backgroundColor || "white";
    this.fontColor = this.element.style.color || "black";

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.element.onmouseup = this.onMouseUp.bind(this);
    this.element.onmousemove = this.onMouseMove.bind(this);
    this.element.addEventListener(
      "dblclick",
      this.onMouseDoubleClick.bind(this)
    );

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
   * removeAnchorFromSelection removes anchor from selected text
   * @param anchor
   */
  removeAnchorFromSelection(anchor: string) {
    const [start, end] = this.cursor.getAbsBounds();

    if (start && end) {
      this.text.getSegmentPosition(start.yLine, start.xLine) as SegmentPosition;

      const startSegment = this.text.getSegmentPosition(
        start.yLine,
        start.xLine
      ) as SegmentPosition;

      const endSegment = this.text.getSegmentPosition(
        end.yLine,
        end.xLine
      ) as SegmentPosition;

      const anchors = this.getAnnotations(startSegment, endSegment);

      if (anchors.some((tag) => tag.getTagName() === anchor)) {
        // find if open tag for given anchor is part of selection, otherwise find the last occurence of that anchor in the text before the selection
        const openTagSegment = this.text.segments
          .slice(0, endSegment.segmentIndex + 1)
          .reverse()
          .find((segment) =>
            segment.openingTags.find((tag) => tag.getTagName() === anchor)
          );

        // replace open tag with empty string in the openTagSegment
        if (openTagSegment) {
          const openTag = openTagSegment.openingTags.find(
            (tag) => tag.getTagName() === anchor
          );
          if (openTag) {
            const openTagsSegmentI = this.text.segments.findIndex(
              (i) =>
                i.lineStart === openTagSegment.lineStart &&
                i.lineEnd === openTagSegment.lineEnd
            );

            this.text.segments[openTagsSegmentI].raw =
              openTagSegment.raw.replace(openTag.getTag(), "");
            // this.text.segments[openTagsSegmentI].parseText();
          }
        }

        // do similar for close tag
        const closeTagSegment = this.text.segments
          .slice(startSegment.segmentIndex, this.text.segments.length)
          .find((segment) =>
            segment.closingTags.find((tag) => tag.getTagName() === anchor)
          );

        if (closeTagSegment) {
          const closeTag = closeTagSegment.closingTags.find(
            (tag) => tag.getTagName() === anchor
          );
          if (closeTag) {
            const closeTagsSegmentI =
              this.text.segments.findIndex(
                (i) =>
                  i.lineStart === closeTagSegment.lineStart &&
                  i.lineEnd === closeTagSegment.lineEnd
              ) || 0;

            this.text.segments[closeTagsSegmentI].raw =
              closeTagSegment.raw.replace(`</${anchor}>`, "");

            // this.text.segments[closeTagsSegmentI].parseText();
          }
        }

        this.text.assignValueFromSegments();

        // update annotator
        // this.text.prepareSegments();
        this.warnings.onTextChanged(this.text.value);
        this.draw();
      }
    }
  }

  onCanvasResize() {
    this.width =
      Number(this.element.style.width.replace("px", "")) * this.ratio;
    this.height =
      Number(this.element.style.height.replace("px", "")) * this.ratio;

    this.element.width = this.width;
    this.element.height = this.height;

    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    const noLinesViewport = Math.ceil(this.height / this.lineHeight) - 1;
    const charsAtLine = Math.floor(this.width / this.charWidth);

    const positionBeforeRel = this.viewport.lineStart / this.text.noLines;

    this.viewport.updateLineEnd(noLinesViewport);
    this.text.updateCharsAtLine(charsAtLine);

    // this function tries to keep the same relative position of the text even its not perfect
    // FIXME: Ideally we should find the exact text at the top of the viewport and try to keep it on top after the resize
    this.viewport.scrollTo(
      Math.floor(positionBeforeRel * this.text.noLines),
      this.text.noLines
    );

    this.scroller?.setRunnerSize(
      (this.viewport.noLines / this.text.noLines) * 100
    );

    this.scroller?.setViewportSize(
      Math.min(100, (this.viewport.noLines / this.text.noLines) * 100)
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
   * Converts mouse/pointer offset Y to canvas buffer Y (same scaling as getCanvasX).
   */
  getCanvasY(offsetY: number): number {
    return offsetY * this.ratio;
  }

  /**
   * onMouseDown is handler for pressed mouse-key event
   * @param e
   */
  onMouseDown(e: MouseEvent) {
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

    this.cursor.selectArea();

    this.annotatedPosition = this.text.cursorToIndex(
      this.viewport,
      this.cursor
    );

    this.draw();
  }

  /**
   * onMouseUp is handler for released mouse-key event
   * @param e
   */
  onMouseUp(e: MouseEvent) {
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

    this.cursor.endSelection();
    this.draw();
  }

  /**
   * onMouseMove is handler for moving mouse-event
   * @param e
   */
  onMouseMove(e: MouseEvent) {
    if (this.cursor.isSelecting()) {
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

      this.cursor.selectArea();
      this.draw();
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
    this.viewport.addScrollOffset(deltaBufferPx, this.lineHeight, this.text.noLines);

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
      const [openingTags, closingTags] = [
        segment.openingTags,
        segment.closingTags,
      ];

      // Process opening tags
      for (const tag of openingTags) {
        // Add to stack for pairing
        tagStack.push(tag);

        // Track in pairs map
        if (!tagPairs.has(tag.getTagName())) {
          tagPairs.set(tag.getTagName(), {});
        }
        tagPairs.get(tag.getTagName())!.opening = tag;

        // Add to final list if within selection range
        // Check: tag must be at/after start AND before end position
        const tagInSelection =
          i > start.segmentIndex ||
          (i === start.segmentIndex &&
            tag.position >= start.rawTextIndex &&
            (i < end.segmentIndex ||
              (i === end.segmentIndex && tag.position < end.rawTextIndex)));
        if (tagInSelection) {
          addToFinal(tag);
        }
      }

      // Process closing tags
      for (const tag of closingTags) {
        // Find matching opening tag in stack
        const matchingIndex = tagStack.findLastIndex(
          (stackTag) =>
            stackTag.getTagName() === tag.getTagName() && !stackTag.closing
        );

        if (matchingIndex !== -1) {
          // Found matching opening tag - record the pairing and remove from stack
          const matchedOpeningTag = tagStack[matchingIndex];
          closingToOpeningMap.set(tag, matchedOpeningTag);
          tagStack.splice(matchingIndex, 1);

          // Check if closing tag is within the selection range
          const closingTagInSelection =
            (i > start.segmentIndex ||
              (i === start.segmentIndex &&
                tag.position >= start.rawTextIndex)) &&
            (i < end.segmentIndex ||
              (i === end.segmentIndex && tag.position < end.rawTextIndex));

          // Check if opening tag opened before end position (could span the selection)
          const openingTagOpenedBeforeEnd =
            matchedOpeningTag.segmentIndex < end.segmentIndex ||
            (matchedOpeningTag.segmentIndex === end.segmentIndex &&
              matchedOpeningTag.position < end.rawTextIndex);

          // Include the opening tag if:
          // 1. Closing tag is within selection range, OR
          // 2. Opening tag opened before end AND closing tag is after start (tag spans the selection)
          const shouldIncludeOpeningTag =
            closingTagInSelection ||
            (openingTagOpenedBeforeEnd &&
              (i > start.segmentIndex ||
                (i === start.segmentIndex &&
                  tag.position >= start.rawTextIndex)));

          if (shouldIncludeOpeningTag) {
            // Tag is active in the selection (either closes within selection or spans it)
            addToFinal(matchedOpeningTag);
          }
        }

        // Track in pairs map
        if (!tagPairs.has(tag.getTagName())) {
          tagPairs.set(tag.getTagName(), {});
        }
        tagPairs.get(tag.getTagName())!.closing = tag;

        // Add closing tag to final list only if within selection range
        // Check: closing tag must be at/after start AND before end position
        // (closing tags are included for post-processing, but will be removed later)
        const closingTagInSelection =
          (i > start.segmentIndex ||
            (i === start.segmentIndex && tag.position >= start.rawTextIndex)) &&
          (i < end.segmentIndex ||
            (i === end.segmentIndex && tag.position < end.rawTextIndex));
        if (closingTagInSelection) {
          addToFinal(tag);
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
    this.scroller.onChange((percentage: number) => {
      const viewportLines = this.viewport.lineEnd - this.viewport.lineStart;
      const scrollableLines = Math.max(
        0,
        this.text.noLines - viewportLines
      );
      const scrollablePx = scrollableLines * this.lineHeight;
      const targetPx = (percentage / 100) * scrollablePx;
      const targetLineFrac = scrollablePx > 0 ? targetPx / this.lineHeight : 0;

      this.viewport.setScrollPosition(
        targetLineFrac,
        0,
        this.lineHeight,
        this.text.noLines
      );
      this.draw();
    });
    this.scroller?.setRunnerSize(
      (this.viewport.noLines / this.text.noLines) * 100
    );

    const viewportSize = this.viewport.noLines / this.text.noLines;
    this.scroller?.setViewportSize(Math.min(100, viewportSize * 100));
  }

  /**
   * draw resets the canvas and redraws the scene anew.
   * First draw lines with text, then allow each component to draw their own logic.
   * TODO - this should be done in conjunction with requestAnimationFrame
   */
  draw() {
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
      this.cursor.xLine = textSegment.charInLineIndex;

      this.cursor.draw(this.ctx, this.viewport, this.text, {
        lineHeight: this.lineHeight,
        charWidth: this.charWidth,
        charsAtLine: this.text.charsAtLine,
      });
    }

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
      for (const tag of annotated) {
        const hlSchema = this.onHighlightCb(tag.getTagName());
        if (hlSchema) {
          // iterate over all tag occurrences
          let occurence: IAbsCoordinates[];
          let i = 0;
          do {
            occurence = this.text.getTagPosition(tag.getTagName(), i);
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
        this.text.noLines,
        this.viewport.scrollOffsetY,
        this.lineHeight
      );
    }
    if (this.lines) {
      this.lines.draw(this.viewport);
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

    this.element.classList.remove(this.text.mode);
    this.element.classList.add(mode);

    this.text.mode = mode;
    this.cursor.reset();
    this.text.prepareSegments();
    this.text.calculateLines();

    if (absIndex !== null && absIndex >= 0) {
      const segPos = this.text.getSegmentFromAbsTextIndex(absIndex);
      if (segPos !== null) {
        const coords = this.text.positionToCursor(this.viewport, segPos);
        if (coords !== null) {
          const absY = this.viewport.lineStart + coords.yLine;
          this.cursor.setPosition(coords.xLine, absY);
          if (absY < this.viewport.lineStart || absY > this.viewport.lineEnd - 1) {
            this.viewport.scrollTo(absY, this.text.noLines);
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
      let indexStart = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(start.yLine, start.xLine, true)
      );
      let indexEnd = this.text.getAbsTextIndexFromPosition(
        this.text.getSegmentPosition(end.yLine, end.xLine, true)
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
        [indexStart, indexEnd] = this.sanitizeEnvelopeRange(indexStart, indexEnd);
      }

      // could be '<tag>text .... text</tag> (closing tag always included if present)
      const selectedRawText = this.text.value.slice(indexStart, indexEnd);
      const beforeText = this.text.value.slice(0, indexStart);
      const afterText = this.text.value.slice(indexEnd);

      this.text.value =
        beforeText +
        openTag.getTag() +
        selectedRawText +
        closeTag.getTag() +
        afterText;

      this.text.prepareSegments();
      this.text.calculateLines();
      this.cursor.reset();
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

  scrollToAnchor(tag: string, index: number = 0) {
    const pos = this.text.getTagPosition(tag, index);
    if (pos.length !== 2) {
      return;
    }

    this.viewport.scrollTo(pos[0].yLine, this.text.noLines);
    this.draw();
  }

  scrollToLine(absLine: number) {
    this.viewport.scrollTo(absLine, this.text.noLines);
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
    const clampedLineStart = Math.max(
      0,
      Math.min(positionBeforeChange, Math.max(0, this.text.noLines - 1))
    );
    const desiredLineStart =
      clampedLineStart + (scrollOffsetBeforeChange || 0) / this.lineHeight;

    this.viewport.setScrollPosition(
      desiredLineStart,
      0,
      this.lineHeight,
      this.text.noLines
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
      this.text.segments[occurence.segmentIndex].lineStart + occurence.lineIndex;
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
          closingTag != null &&
          start <= tag.start &&
          end >= closingTag.end
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
        if (
          closingTag &&
          start === tag.start &&
          end >= closingTag.end
        ) {
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
