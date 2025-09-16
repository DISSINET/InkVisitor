import Cursor, { DIRECTION } from "./Cursor";
import Highlighter, { IAbsCoordinates, CursorStyle } from "./Highlighter";
import Keys from "./Keys";
import { Lines } from "./Lines";
import Scroller from "./Scroller";
import Text, { Tag, SegmentPosition } from "./Text";
import Viewport from "./Viewport";
import { Warnings } from "./warnings";
import { EditMode, HighlightMode } from "./constants";

// Updated regex to properly handle tags with attributes
// Opening tags: <tagname attr="value"> or <tagname>
export const openingTagRegex = /<([a-zA-Z0-9\-_\s="']+)>/g;
// Closing tags: </tagname>
export const closingTagRegex = /<\/([a-zA-Z0-9\-_]+)>/g;
// General tag removal regex
export const tagRemovalRegex = /<\/?[^<>]+?>/g;
// Opening tag with specific name and optional attributes: <tagname attr="value"> or <tagname>
export const createOpeningTagRegex = (tagName: string) => new RegExp(`<${tagName}(?:\\s+[^>]*)?>`, 'g');

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
  anchors: string[];
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
  font: string = "12px Monospace";

  fontColor: string = "black";
  bgColor: string = "white";
  selectColor: string = "rgba(0, 0, 0)";
  selectOpacity: number = 0.5;

  charWidth: number = 0;
  lineHeight: number = 15;

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
    this.font = `${12 * this.ratio}px Monospace`;

    this.lineHeight = 15 * this.ratio;

    // observe canvas element for resize
    const resizeObserver = new ResizeObserver(this.onCanvasResize.bind(this));
    resizeObserver.observe(this.element);

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

      if (anchors.includes(anchor)) {
        // find if open tag for given anchor is part of selection, otherwise find the last occurence of that anchor in the text before the selection
        const openTagSegment = this.text.segments
          .slice(0, endSegment.segmentIndex + 1)
          .reverse()
          .find((segment) =>
            segment.openingTags.find((tag) => tag.tag === anchor)
          );

        // replace open tag with empty string in the openTagSegment
        if (openTagSegment) {
          const openTag = openTagSegment.openingTags.find(
            (tag) => tag.tag === anchor
          );
          if (openTag) {
            const openTagsSegmentI = this.text.segments.findIndex(
              (i) =>
                i.lineStart === openTagSegment.lineStart &&
                i.lineEnd === openTagSegment.lineEnd
            );

            this.text.segments[openTagsSegmentI].raw =
              openTagSegment.raw.replace(`<${anchor}>`, "");
            // this.text.segments[openTagsSegmentI].parseText();
          }
        }

        // do similar for close tag
        const closeTagSegment = this.text.segments
          .slice(startSegment.segmentIndex, this.text.segments.length)
          .find((segment) =>
            segment.closingTags.find((tag) => tag.tag === anchor)
          );

        if (closeTagSegment) {
          const closeTag = closeTagSegment.closingTags.find(
            (tag) => tag.tag === anchor
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

  onCanvasResize(entries: ResizeObserverEntry[]) {
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

    // FIXME try to update the cursor position based on the text that was selected before the resize
    const [start, end] = this.cursor.getAbsBounds();
    const selectedTextBefore =
      start && end ? this.text.getRangeText(start, end) : "";

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
   * onMouseDown is handler for pressed mouse-key event
   * @param e
   */
  onMouseDown(e: MouseEvent) {
    // move the cursor to selected position, but dont allow to move over the line boundaries (x axis)
    this.cursor.setPositionFromEvent(e, this.lineHeight, this.charWidth);
    const segment = this.text.cursorToIndex(this.viewport, this.cursor);
    if (segment) {
      const line = this.text.getLineFromPosition(segment);
      if (line.length < this.cursor.xLine) {
        this.cursor.xLine = line.length;
      }
    }

    this.cursor.selectArea(this.viewport.lineStart);

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
    // move the cursor to selected position, but dont allow to move over the line boundaries (x axis)
    this.cursor.setPositionFromEvent(e, this.lineHeight, this.charWidth);
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
      // move the cursor to selected position, but dont allow to move over the line boundaries (x axis)
      this.cursor.setPositionFromEvent(e, this.lineHeight, this.charWidth);
      const segment = this.text.cursorToIndex(this.viewport, this.cursor);
      if (segment) {
        const line = this.text.getLineFromPosition(segment);
        if (line.length < this.cursor.xLine) {
          this.cursor.xLine = line.length;
        }
      }

      this.cursor.selectArea(this.viewport.lineStart);
      this.draw();
    }
  }

  onMouseDoubleClick(e: MouseEvent) {
    // move the cursor to selected position, but dont allow to move over the line boundaries (x axis)
    this.cursor.setPositionFromEvent(e, this.lineHeight, this.charWidth);
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
      yLine: this.cursor.yLine + this.viewport.lineStart,
    };
    this.cursor.selectEnd = {
      xLine: this.cursor.xLine + offsetRight,
      yLine: this.cursor.yLine + this.viewport.lineStart,
    };
    this.cursor.xLine = this.cursor.selectEnd.xLine;
    this.cursor.yLine = this.cursor.selectEnd.yLine;
    this.cursor.selectDirection = DIRECTION.FORWARD;
    this.draw();
  }

  /**
   * onWheel is handler for mouse-wheel-event
   * @param e
   */
  onWheel(e: WheelEvent) {
    const down = e.deltaY < 0 ? false : true;

    if (down) {
      this.viewport.scrollDown(1, this.text.noLines);
    } else if (!down) {
      this.viewport.scrollUp(1);
    }

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
  ): string[] {
    // remaining opened tags - true = open, false = closed
    const untilStart: Record<string, number> = {};
    const final: Record<string, boolean> = {};

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

    // find still opened until current window
    for (let i = 0; i <= start.segmentIndex; i++) {
      const segment = this.text.segments[i];
      let openingTags, closingTags: Tag[];
      if (i === start.segmentIndex) {
        [openingTags, closingTags] = segment.getTagsBeforePosition(
          start.rawTextIndex
        );
      } else {
        [openingTags, closingTags] = [segment.openingTags, segment.closingTags];
      }

      for (const tag of openingTags) {
        untilStart[tag.tag] = (untilStart[tag.tag] || 0) + 1;
      }
      for (const tag of closingTags) {
        untilStart[tag.tag] = (untilStart[tag.tag] || 0) - 1;
      }
    }

    // use everything that is between start and end
    for (let i = start.segmentIndex; i < end.segmentIndex; i++) {
      const segment = this.text.segments[i];
      let openingTags, closingTags: Tag[];
      if (i === start.segmentIndex) {
        [openingTags, closingTags] = segment.getTagsAfterPosition(
          start.rawTextIndex
        );
      } else {
        [openingTags, closingTags] = [segment.openingTags, segment.closingTags];
      }
      for (const tag of openingTags) {
        final[tag.tag] = true;
      }
      for (const tag of closingTags) {
        final[tag.tag] = true;
      }
    }

    // process end segment
    const endSegment = this.text.segments[end.segmentIndex];
    let opened, closed: Tag[];
    if (start.segmentIndex !== end.segmentIndex) {
      // if end segment != start segment - use everything up to end position
      [opened, closed] = endSegment.getTagsBeforePosition(end.rawTextIndex);
    } else {
      // if end segment === start segment
      const segment = this.text.segments[end.segmentIndex];
      [opened, closed] = segment.getTagsInPosition(
        start.rawTextIndex,
        end.rawTextIndex
      );
    }
    for (const tag of opened) {
      final[tag.tag] = true;
    }
    for (const tag of closed) {
      final[tag.tag] = true;
    }

    // reduce untilStart
    for (const tag of Object.keys(untilStart)) {
      if (untilStart[tag] > 0) {
        final[tag] = true;
      }
    }

    return Object.keys(final);
  }

  /**
   * addScroller adds optional Scroller component to stack
   * @param e
   */
  addScroller(scrollerDiv: HTMLDivElement) {
    this.scroller = new Scroller(scrollerDiv);
    this.scroller.onChange((percentage: number) => {
      const toLine = Math.floor(
        ((this.text.noLines -
          (this.viewport.lineEnd - this.viewport.lineStart)) /
          100) *
          percentage
      );

      this.viewport.scrollTo(toLine, this.text.noLines);
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
    // @ts-ignore
    this.ctx.reset();

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = this.font;
    this.ctx.fillStyle = this.fontColor;

    const textToRender = this.text.getViewportText(this.viewport);

    for (
      let renderLine = 0;
      renderLine <= this.viewport.lineEnd - this.viewport.lineStart;
      renderLine++
    ) {
      const textLine = textToRender[renderLine];
      if (textLine) {
        this.ctx.fillText(textLine, 0, (renderLine + 1) * this.lineHeight);
      }
    }

    const textSegment = this.text.cursorToIndex(this.viewport, this.cursor);

    if (textSegment) {
      // fix cursor position to end of the line (cursor.xLine could be virtually infinity)
      this.cursor.xLine = textSegment.charInLineIndex;

      this.cursor.draw(
        this.ctx,
        this.viewport,
        this.text,
        {
          lineHeight: this.lineHeight,
          charWidth: this.charWidth,
          charsAtLine: this.text.charsAtLine,
        },
        this.text.mode
      );
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
      const startPos = this.text.getSegmentPosition(this.viewport.lineStart, 0);
      const endPos = this.text.getSegmentPosition(
        this.viewport.lineEnd,
        this.text.charsAtLine
      );

      const annotated: string[] = this.getAnnotations(startPos, endPos);
      const higlightItems: {
        schema: HighlightSchema;
        start: IAbsCoordinates;
        end: IAbsCoordinates;
      }[] = [];
      for (const tag of annotated) {
        const hlSchema = this.onHighlightCb(tag);
        if (hlSchema) {
          // iterate over all tag occurrences
          let occurence: IAbsCoordinates[];
          let i = 0;
          do {
            occurence = this.text.getTagPosition(tag, i);
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
        highlighter.draw(
          this.ctx,
          this.viewport,
          this.text,
          {
            lineHeight: this.lineHeight,
            charWidth: this.charWidth,
            charsAtLine: this.text.charsAtLine,
          },
          this.text.mode
        );
      }
    }

    if (this.scroller) {
      this.scroller.update(
        this.viewport.lineStart,
        this.viewport.lineEnd,
        this.text.noLines
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
    this.element.classList.remove(this.text.mode);
    this.element.classList.add(mode);

    this.text.mode = mode;
    this.cursor.reset();
    this.text.prepareSegments();
    this.text.calculateLines();
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
    const openTag = new Tag(0, anchor, false);
    if (attributes) {
      openTag.attributes = attributes;
    }
    const closeTag = new Tag(0, anchor, true);

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
      [indexStart, indexEnd] = this.sanitizeEnvelopeRange(indexStart, indexEnd);

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

    this.text.value = newText;
    this.text.prepareSegments();
    this.text.calculateLines();
    this.warnings.onTextChanged(this.text.value);

    if (positionBeforeChange < this.text.noLines) {
      this.scrollToLine(positionBeforeChange);
    } else {
      this.scrollToLine(this.text.noLines - 1);
    }
  }

  /**
   * searches for substring in the whole text, returning prepared Occurrence data
   * @param toFind
   * @returns
   */
  search(toFind: string): Occurrence[] {
    const occurrences = [];

    for (const segmentI in this.text.segments) {
      for (const lineI in this.text.segments[segmentI].lines) {
        let startIndex = 0;
        const line = this.text.segments[segmentI].lines[lineI];
        while (startIndex < line.length) {
          const index = line.indexOf(toFind, startIndex);
          if (index === -1) break;

          occurrences.push({
            segmentIndex: parseInt(segmentI),
            lineIndex: parseInt(lineI),
            start: index,
            end: index + toFind.length,
          });
          startIndex = index + 1;
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
    this.cursor.xLine = occurence.end;
    this.cursor.yLine = occurence.lineIndex;

    this.cursor.selectStart = {
      xLine: occurence.start,
      yLine:
        this.text.segments[occurence.segmentIndex].lineStart +
        occurence.lineIndex,
    };
    this.cursor.selectEnd = {
      xLine: occurence.end,
      yLine:
        this.text.segments[occurence.segmentIndex].lineStart +
        occurence.lineIndex,
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
          this.cursor.setPosition(
            area[0].xLine,
            area[0].yLine - this.viewport.lineStart
          );
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
      this.cursor.setPosition(
        area[0].xLine,
        area[0].yLine - this.viewport.lineStart
      );
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
   * Skip closing XML tags on the right side of the given index to avoid gathering additional non-XML tag characters
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
   * Prevent overlapping anchors by ensuring proper nesting
   * When a shorter span selection arrives at the end of another anchor, the shorter span should be within the longer span
   * When a longer span is selected, the anchors should encompass the shorter span
   * @param indexStart The current start index
   * @param indexEnd The current end index
   * @returns The new [indexStart, indexEnd] after preventing overlaps
   */
  private sanitizeEnvelopeRange(
    indexStart: number,
    indexEnd: number
  ): [number, number] {
    const text = this.text.value;
    // Case 1: Check if selection starts at the beginning of an opening tag
    const currentSelection = text.slice(indexStart, indexEnd);
    
    // Check if the selection itself starts with an opening tag
    openingTagRegex.lastIndex = 0; // Reset regex
    const openingMatch = openingTagRegex.exec(currentSelection);
    if (openingMatch && openingMatch.index === 0) {
      // Selection starts with an opening tag, move start to after the tag
      const openingTagEnd = indexStart + openingMatch[0].length;
      indexStart = openingTagEnd;
    }
    
    // Case 2: Check if selection ends with closing tags that don't belong to content within the selection
    const updatedSelection = text.slice(indexStart, indexEnd);
    if (updatedSelection.endsWith(">") && updatedSelection.includes("</")) {
      // Find all closing tags in the selection
      let match;
      closingTagRegex.lastIndex = 0;
      const closingTagsInSelection = [];

      while ((match = closingTagRegex.exec(updatedSelection)) !== null) {
        closingTagsInSelection.push({
          tagName: match[1],
          start: indexStart + match.index,
          end: indexStart + match.index + match[0].length,
        });
      }

      // Process closing tags from right to left (last to first)
      for (let i = closingTagsInSelection.length - 1; i >= 0; i--) {
        const closingTag = closingTagsInSelection[i];
        const openingTagName = closingTag.tagName;
        const openingPattern = createOpeningTagRegex(openingTagName);
        let openingMatch;
        let hasMatchingOpeningInSelection = false;

        // Check if there's a matching opening tag within the selection
        while ((openingMatch = openingPattern.exec(updatedSelection)) !== null) {
          const openingTagStart = indexStart + openingMatch.index;
          const openingTagEnd = openingTagStart + openingMatch[0].length;
          
          // Only keep the closing tag if the opening tag is completely within the selection
          // and the opening tag comes before the closing tag
          if (openingTagStart >= indexStart && openingTagEnd <= closingTag.start && 
              openingTagEnd <= indexEnd) {
            hasMatchingOpeningInSelection = true;
            break;
          }
        }

        // If no matching opening tag found within the selection, remove this closing tag
        if (!hasMatchingOpeningInSelection) {
          indexEnd = closingTag.start;
        }
      }
    }

    return [indexStart, indexEnd];
  }

}
