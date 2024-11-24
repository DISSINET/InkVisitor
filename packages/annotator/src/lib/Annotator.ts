import Cursor from "./Cursor";
import Highlighter, { IAbsCoordinates } from "./Highlighter";
import { Lines } from "./Lines";
import Scroller from "./Scroller";
import Text, { SegmentPosition } from "./Text";
import Viewport from "./Viewport";
import { EditMode, HighlightMode } from "./constants";

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

  annotatedPosition: SegmentPosition | null = null;

  // to control highlightChangeCb callback
  lastSelectedText = "";
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

    this.bgColor = this.element.style.backgroundColor || "white";
    this.fontColor = this.element.style.color || "black";

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.element.onmouseup = this.onMouseUp.bind(this);
    this.element.onmousemove = this.onMouseMove.bind(this);
    this.element.onkeydown = this.onKeyDown.bind(this);
    this.element.onkeydown = this.onKeyDown.bind(this);
    this.element.addEventListener(
      "dblclick",
      this.onMouseDoubleClick.bind(this)
    );

    this.clickCount = 0;

    this.previousRenderViewportLineStart = 0;

    this.draw();
  }

  setSelectStyle(selectColor: string, selectOpacity: number) {
    this.selectColor = selectColor;
    this.selectOpacity = selectOpacity;

    this.cursor.style = {
      color: this.selectColor,
      opacity: this.selectOpacity,
    };
  }

  /**
   * removeAnchorFromSelection removes anchor from selected text
   * @param anchor
   */
  removeAnchorFromSelection(anchor: string) {
    const [start, end] = this.cursor.getBounds();

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
    const [start, end] = this.cursor.getBounds();
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

  /**
   * onSelectText stores callback for changed Selected area
   * Will be used only if text really changes
   * @param cb
   */
  onSelectText(cb: (text: Selected) => void) {
    this.lastSelectedText = "";
    this.onSelectTextCb = (text: Selected) => {
      if (text.text === this.lastSelectedText) {
        return;
      }
      this.lastSelectedText = text.text;
      cb(text);
    };
  }

  onScroll(cb: (line: number) => void) {
    this.onScrollCb = cb;
  }

  /**
   * onKeyDown is handler for pressed key event
   * @param e
   */
  onKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    // writing to text
    const key = e.key;
    const nonCharKeys = [
      "CapsLock",
      "Shift",
      "Control",
      "Alt",
      "Tab",
      "Escape",
      "Enter",
      "Delete",
      "Meta",
      "PageUp",
      "PageDown",
      "Fn",
      "FnLock",
      "NumLock",
      "ScrollLock",
    ];

    switch (e.key) {
      case "Enter":
        if (this.text.mode === EditMode.HIGHLIGHT) {
          return;
        }
        this.text.insertNewline(this.viewport, this.cursor);
        this.cursor.moveToNewline();
        if (!this.text.cursorToIndex(this.viewport, this.cursor)) {
          this.cursor.move(0, -1);
        }
        break;

      case "ArrowUp":
        this.cursor.move(0, -1);
        if (this.cursor.yLine < 0) {
          this.viewport.scrollTo(
            this.viewport.lineStart + this.cursor.yLine,
            this.text.noLines
          );
          this.cursor.yLine = 0;
        }
        if (this.cursor.isSelected()) {
          this.cursor.selectStart = undefined;
          this.cursor.selectEnd = undefined;
        }
        break;

      case "ArrowDown":
        this.cursor.move(0, 1);
        if (
          this.cursor.yLine >
          this.viewport.lineEnd - this.viewport.lineStart
        ) {
          this.viewport.scrollTo(
            this.viewport.lineStart + 1,
            this.text.noLines
          );
          this.cursor.yLine = this.viewport.lineEnd - this.viewport.lineStart;
        }
        if (this.cursor.isSelected()) {
          this.cursor.selectStart = undefined;
          this.cursor.selectEnd = undefined;
        }
        break;

      case "ArrowLeft": {
        // default delta to the left
        let offsetLeft = -1;
        const originalXLine = this.cursor.xLine;
        const originalYline = this.cursor.yLine;

        if (this.cursor.selectStart) {
          // if already selected text (dblclick), reuse selectStart position as cursor's position
          this.cursor.xLine = this.cursor.selectStart.xLine;
          this.cursor.yLine =
            this.cursor.selectStart.yLine - this.viewport.lineStart;
        }

        if (e.ctrlKey) {
          // ctrl key used - find last word to the left
          offsetLeft = 0;
          while (!offsetLeft) {
            [offsetLeft] = this.text.getCursorWordOffsets(
              this.viewport,
              this.cursor
            );

            if (offsetLeft === -0) {
              this.cursor.move(-1, 0);
              if (this.cursor.xLine <= 0) {
                this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
                this.cursor.xLine = Math.floor(this.width / this.charWidth) - 1;
              }
            }
          }
        }

        // go 1 line up if at the start
        if (this.cursor.xLine <= 0) {
          // only if there is a way to go up
          if (this.cursor.yLine > 0) {
            this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
            const line = this.text.getCurrentLine(this.viewport, this.cursor);
            this.cursor.xLine = line?.length || 0;

            if (this.cursor.selectStart) {
              this.cursor.selectStart.xLine = this.cursor.xLine;
              this.cursor.selectStart.yLine =
                this.viewport.lineStart + this.cursor.yLine;
            }
          }
        } else {
          this.cursor.move(offsetLeft, 0);
        }

        if (e.shiftKey) {
          // copy cursor's current position as selectStart
          this.cursor.selectStart = {
            xLine: this.cursor.xLine,
            yLine: this.viewport.lineStart + this.cursor.yLine,
          };
          // set selectEnd to cursor's original position as initialization
          if (!this.cursor.selectEnd) {
            this.cursor.selectEnd = {
              xLine: originalXLine,
              yLine: originalYline,
            };
          }
        } else {
          if (this.cursor.isSelected()) {
            // if something is selected -> move the cursor to leftmost position and cancel the selection
            this.cursor.xLine =
              this.cursor.selectStart?.xLine || this.cursor.xLine;
            this.cursor.yLine = this.cursor.selectStart
              ? this.cursor.selectStart.yLine - this.viewport.lineStart
              : this.cursor.yLine;
            offsetLeft = 0;
          }

          this.cursor.selectStart = undefined;
          this.cursor.selectEnd = undefined;
        }

        break;
      }

      case "ArrowRight": {
        // default delta to the right
        let offsetRight = 1;
        const originalXLine = this.cursor.xLine;
        const originalYline = this.cursor.yLine;

        if (this.cursor.selectEnd) {
          // if already selected text (dblclick), reuse selectEnd position as cursor's position
          this.cursor.xLine = this.cursor.selectEnd.xLine;
          this.cursor.yLine =
            this.cursor.selectEnd.yLine - this.viewport.lineStart;
        }

        if (e.ctrlKey) {
          // ctrl key used - find next word to the right
          offsetRight = 0;
          while (!offsetRight) {
            [, offsetRight] = this.text.getCursorWordOffsets(
              this.viewport,
              this.cursor
            );
            if (!offsetRight) {
              this.cursor.move(1, 0);
              if (this.cursor.xLine > Math.floor(this.width / this.charWidth)) {
                this.cursor.xLine = 0;
                this.cursor.yLine++;
              }
            } else if (
              offsetRight + this.cursor.xLine >
              Math.floor(this.width / this.charWidth)
            ) {
              this.cursor.xLine = 0;
              this.cursor.yLine++;
            }

            if (this.cursor.yLine > this.viewport.noLines) {
              this.cursor.yLine = this.viewport.noLines - 1;
              break;
            }
          }
        }

        this.cursor.move(offsetRight, 0);

        // check if we are at the end of the line -> move to next line
        const currentLine =
          this.text.getCurrentLine(this.viewport, this.cursor) || "";
        let backupXLine = this.cursor.xLine;
        let backupYLine = this.cursor.yLine;

        if (currentLine.length < this.cursor.xLine) {
          this.cursor.xLine = 0;
          this.cursor.yLine++;
        }

        // revert if end of the document reached
        if (!this.text.cursorToIndex(this.viewport, this.cursor)) {
          this.cursor.xLine = backupXLine - 1;
          this.cursor.yLine = backupYLine;
        }

        if (e.shiftKey) {
          // copy cursor's current position as selectStart
          this.cursor.selectEnd = {
            xLine: this.cursor.xLine,
            yLine: this.viewport.lineStart + this.cursor.yLine,
          };
          // set selectStart to cursor's original position as initialization
          if (!this.cursor.selectStart) {
            this.cursor.selectStart = {
              xLine: originalXLine,
              yLine: originalYline,
            };
          }
        } else {
          if (this.cursor.isSelected()) {
            // if something is selected -> move the cursor to rightmost position and cancel the selection
            this.cursor.xLine =
              this.cursor.selectEnd?.xLine || this.cursor.xLine;
            this.cursor.yLine = this.cursor.selectEnd
              ? this.cursor.selectEnd.yLine - this.viewport.lineStart
              : this.cursor.yLine;
            offsetRight = 0;
          }

          this.cursor.selectStart = undefined;
          this.cursor.selectEnd = undefined;
        }

        break;
      }

      case "Backspace":
        if (this.text.mode === EditMode.HIGHLIGHT) {
          return;
        }

        const area = this.cursor.getSelectedArea();
        if (area) {
          this.text.deleteRangeText(area[0], area[1], this.viewport);
          this.cursor.reset();
          this.cursor.setPosition(
            area[0].xLine,
            area[0].yLine - this.viewport.lineStart
          );
        } else {
          const segmentBefore = this.text.cursorToIndex(
            this.viewport,
            this.cursor
          );
          let upSegmentEmpty = false;
          if (segmentBefore && segmentBefore.segmentIndex > 0) {
            upSegmentEmpty =
              !this.text.segments[segmentBefore?.segmentIndex - 1].raw;
          }
          this.text.deleteText(this.viewport, this.cursor, 1);
          const segmentAfter = this.text.cursorToIndex(
            this.viewport,
            this.cursor
          );

          const xDiff =
            (segmentAfter?.rawTextIndex || 0) -
            (segmentBefore?.rawTextIndex || 0);

          if (xDiff < 0) {
            this.cursor.move((xDiff + 1) * -1, 0);
          } else if (xDiff > 0) {
            if (segmentBefore?.segmentIndex !== segmentAfter?.segmentIndex) {
              if (upSegmentEmpty) {
                this.cursor.move(0, -1);
              } else {
                this.cursor.move(Infinity, -1);
              }
            } else {
              this.cursor.move(-xDiff, 0);
            }
          } else {
            if (segmentAfter!.rawTextIndex > 0) {
              this.cursor.move(-1, 0);
            } else {
              this.cursor.move(-1, -1);
            }
          }

          if (this.cursor.xLine < 0) {
            this.cursor.move(Infinity, 0);
          }

          /*const segmentAfter = this.text.cursorToIndex(
          this.viewport,
          this.cursor
        );
      
        if (this.cursor.xLine < 0) {
          this.cursor.xLine = 0;
          this.draw();
          return;
        }
        if (xDiff > 0) {
          this.cursor.move(Infinity, -1);
          this.cursor.move(-xDiff, 0);
        }
*/
          if (this.onTextChangeCb) {
            this.onTextChangeCb(this.text.value);
          }
        }
        break;

      case "PageUp":
        this.viewport.scrollUp(this.viewport.noLines);
        break;

      case "PageDown":
        this.viewport.scrollDown(this.viewport.noLines, this.text.noLines);
        break;

      case "Delete":
        if (this.text.mode === EditMode.HIGHLIGHT) {
          return;
        }
        return;
        this.text.deleteText(this.viewport, this.cursor, -1);
        this.cursor.move(0, 0);
        break;

      case "End":
        const line = this.text.getCurrentLine(this.viewport, this.cursor);
        if (line) {
          this.cursor.xLine = line.length;
        }
        break;

      default:
        if (e.ctrlKey || e.metaKey) {
          if (e.key === "c") {
            window.navigator.clipboard.writeText(this.lastSelectedText);
          }
          if (e.key === "v") {
            window.navigator.clipboard.readText().then((clipText: string) => {
              this.text.insertText(this.viewport, this.cursor, clipText);
              this.draw();
            });
          }
          break;
        }

        if (!nonCharKeys.includes(key)) {
          if (this.text.mode === EditMode.HIGHLIGHT) {
            return;
          }

          this.text.insertText(this.viewport, this.cursor, key);
          if (this.onTextChangeCb) {
            this.onTextChangeCb(this.text.value);
          }
          this.cursor.move(+1, 0);
        }
    }

    if (this.text.mode !== "highlight" && this.onTextChangeCb) {
      this.onTextChangeCb(this.text.value);
    }
    this.draw();
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
    const tagsUpToEnd: Record<string, boolean> = {};
    const tagsUpToStart: Record<string, boolean> = {};

    if (start) {
      // find still opened tags up to the end position - point based check
      for (let i = 0; i < start.segmentIndex; i++) {
        const segment = this.text.segments[i];
        for (const tag of segment.openingTags) {
          tagsUpToStart[tag.tag] = true;
        }
        for (const tag of segment.closingTags) {
          tagsUpToStart[tag.tag] = false;
        }
      }

      const startSegment = this.text.segments[start.segmentIndex];
      const [segOpened, segClosed] = startSegment.getTagsForPosition(start);
      for (const tag of segOpened) {
        tagsUpToStart[tag.tag] = true;
      }
      for (const tag of segClosed) {
        tagsUpToStart[tag.tag] = false;
      }
    }

    if (end) {
      // find still opened tags up to the end position - point based check
      for (let i = start?.segmentIndex || 0; i < end.segmentIndex; i++) {
        const segment = this.text.segments[i];
        for (const tag of segment.openingTags) {
          tagsUpToEnd[tag.tag] = true;
        }
        for (const tag of segment.closingTags) {
          tagsUpToEnd[tag.tag] = false;
        }
      }

      const endSegment = this.text.segments[end.segmentIndex];
      const [segOpened, segClosed] = endSegment.getTagsForPosition(end);
      for (const tag of segOpened) {
        tagsUpToEnd[tag.tag] = true;
      }
      for (const tag of segClosed) {
        tagsUpToEnd[tag.tag] = false;
      }
    }

    const final: Record<string, boolean> = {};
    for (const tag of Object.keys(tagsUpToStart)) {
      if (tagsUpToStart[tag]) {
        final[tag] = true;
      }
    }
    for (const tag of Object.keys(tagsUpToEnd)) {
      if (tagsUpToStart[tag] === undefined) {
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
        this.text.lines,
        {
          lineHeight: this.lineHeight,
          charWidth: this.charWidth,
          charsAtLine: this.text.charsAtLine,
        },
        this.text.mode
      );
    }

    if (this.onSelectTextCb && this.cursor.isSelected()) {
      const [start, end] = this.cursor.getBounds();
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
        });
      } else {
        this.onSelectTextCb({
          text: "",
          anchors: [],
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
          let i = 1;
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
          this.text.lines,
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

  addAnchor(anchor: string) {
    if (!this.cursor.isSelected()) {
      return;
    }

    let [start, end] = this.cursor.getBounds();

    if (start && end) {
      const indexPositionStart = this.text.relativeToAbsIndex(
        new Cursor(
          this.ratio,
          start.xLine,
          start.yLine - this.viewport.lineStart
        ),
        this.viewport
      );
      const indexPositionEnd = this.text.relativeToAbsIndex(
        new Cursor(this.ratio, end.xLine, end.yLine - this.viewport.lineStart),
        this.viewport
      );

      // this.text.value =
      //   this.text.value.slice(0, indexPositionStart) +
      //   `<${anchor}>` +
      //   this.text.value.slice(indexPositionStart);

      // this.text.value =
      //   this.text.value.slice(0, indexPositionEnd) +
      //   `</${anchor}>` +
      //   this.text.value.slice(indexPositionEnd);

      const beforeText = this.text.value.slice(0, indexPositionStart);
      const afterText = this.text.value.slice(indexPositionEnd);
      const insideText = this.text.value.slice(
        indexPositionStart,
        indexPositionEnd
      );

      this.text.value =
        beforeText + `<${anchor}>` + insideText + `</${anchor}>` + afterText;

      this.text.prepareSegments();
      this.text.calculateLines();
      this.cursor.reset();
      this.draw();
    }
  }

  scrollToAnchor(tag: string, occurence: number = 1) {
    const pos = this.text.getTagPosition(tag, occurence);

    if (pos.length !== 2) {
      return;
    }

    this.viewport.scrollTo(pos[0].yLine, this.text.noLines);
    this.draw();
  }

  scrollToLine(line: number) {
    this.viewport.scrollTo(line, this.text.noLines);
    this.draw();
  }

  updateText(newText: string) {
    const positionBeforeChange = this.viewport.lineStart;

    this.text.value = newText;
    this.text.prepareSegments();
    this.text.calculateLines();

    if (positionBeforeChange < this.text.noLines) {
      this.scrollToLine(positionBeforeChange);
    } else {
      this.scrollToLine(this.text.noLines - 1);
    }
  }
}
