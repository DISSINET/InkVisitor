import Cursor from "./Cursor";
import { Lines } from "./Lines";
import Scroller from "./Scroller";
import Text, { Mode, SegmentPosition } from "./Text";
import Viewport from "./Viewport";

export interface HighlightSchema {
  mode: "background";
  style: {
    color: string;
  };
}

// DrawingOptions bundles required sizes shared by multiple components while drawing into canvas
export interface DrawingOptions {
  charWidth: number;
  lineHeight: number;
  charsAtLine: number;
  mode: Mode
}

export interface Highlighted {
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
  charWidth: number = 0;
  lineHeight: number = 15;

  // size for virtual area inside the canvas element
  width: number = 0;
  height: number = 0;

  // components here
  viewport: Viewport;
  cursor: Cursor;
  text: Text;
  scroller?: Scroller;
  lines?: Lines;

  // to control highlightChangeCb callback
  lastHighlightedText = "";

  // callbacks
  onSelectTextCb?: (text: Highlighted) => void;
  onHighlightCb?: (entityId: string) => HighlightSchema | void;

  constructor(element: HTMLCanvasElement, inputText: string) {
    this.element = element;
    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context");
    }
    this.ctx = ctx;
    this.width = this.element.width;
    this.height = this.element.height;
    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    const charsAtLine = Math.floor(this.width / this.charWidth);

    const noLinesViewport = Math.ceil(this.height / this.lineHeight) - 1;
    this.viewport = new Viewport(0, noLinesViewport);
    this.cursor = new Cursor();

    this.text = new Text(inputText, charsAtLine);

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.element.onmouseup = this.onMouseUp.bind(this);
    this.element.onmousemove = this.onMouseMove.bind(this);
    this.element.onkeydown = this.onKeyDown.bind(this);
  }

  onHighlight(cb: (entityId: string) => HighlightSchema | void): void {
    this.onHighlightCb = cb;
  }

  /**
   * onSelectText stores callback for changed highlighted area
   * Will be used only if text really changes
   * @param cb
   */
  onSelectText(cb: (text: Highlighted) => void) {
    this.lastHighlightedText = "";
    this.onSelectTextCb = (text: Highlighted) => {
      if (text.text === this.lastHighlightedText) {
        return;
      }
      this.lastHighlightedText = text.text;
      cb(text);
    };
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
    ];

    switch (e.key) {
      case "Enter":
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
        break;

      case "ArrowLeft":
        this.cursor.move(-1, 0);
        if (this.cursor.xLine < 0) {
          this.cursor.yLine = Math.max(0, this.cursor.yLine - 1);
          this.cursor.xLine = Math.floor(this.width / this.charWidth) - 1;
        }
        break;

      case "ArrowRight":
        this.cursor.move(1, 0);

        // TODO: check if cursor is at the end of the line
        if (this.cursor.xLine > Math.floor(this.width / this.charWidth)) {
          this.cursor.xLine = 0;
          this.cursor.yLine++;
        }
        break;

      case "Backspace":
        const segmentBefore = this.text.cursorToIndex(this.viewport, this.cursor)
   
        this.text.deleteText(this.viewport, this.cursor, 1);
       

        const segmentAfter = this.text.cursorToIndex(this.viewport, this.cursor);
        const xDiff = (segmentAfter?.rawTextIndex || 0) - (segmentBefore?.rawTextIndex || 0)
        this.cursor.move(-1, 0);
        if (this.cursor.xLine < 0) {
          this.cursor.xLine = 0;
          this.draw();
          return
        }
        if(xDiff > 0) {
          this.cursor.move(Infinity, -1);
          this.cursor.move(-xDiff, 0)
        }
        break;

      case "Delete":
        this.text.deleteText(this.viewport, this.cursor, -1);
        this.cursor.move(0, 0);
        break;

      default:
        if (e.ctrlKey) {
          if (e.key === "c") {
            window.navigator.clipboard.writeText(this.lastHighlightedText);
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
          this.text.insertText(this.viewport, this.cursor, key);
          this.cursor.move(+1, 0);
        }
    }

    this.draw();
  }

  /**
   * setCharWidth sets the initial size for characted
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
    this.cursor.setPosition(e, this.lineHeight, this.charWidth);
    this.cursor.selectArea(this.viewport.lineStart);
    this.draw();
  }

  /**
   * onMouseUp is handler for released mouse-key event
   * @param e
   */
  onMouseUp(e: MouseEvent) {
    this.cursor.setPosition(e, this.lineHeight, this.charWidth);
    this.cursor.endHighlight();
    this.draw();
  }

  /**
   * onMouseMove is handler for moving mouse-event
   * @param e
   */
  onMouseMove(e: MouseEvent) {
    if (this.cursor.isSelecting()) {
      this.cursor.setPosition(e, this.lineHeight, this.charWidth);
      this.cursor.selectArea(this.viewport.lineStart);
      this.draw();
    }
  }

  /**
   * onWheel is handler for mouse-wheel-event
   * @param e
   */
  onWheel(e: WheelEvent) {
    const up = e.deltaY < 0 ? false : true;
    if (up) {
      this.viewport.scrollDown(1, this.text.noLines);
    } else if (!up) {
      this.viewport.scrollUp(1);
    }

    e.preventDefault();
    this.draw();
  }

  addLines(canvasElement: HTMLCanvasElement): void {
    this.lines = new Lines(canvasElement, this.lineHeight, this.charWidth);
  }

  getAnnotations(startSegment: SegmentPosition|null, endSegment: SegmentPosition|null): string[] {
    // remaining opened tags - true = open, false = closed
    const tags: Record<string, boolean> = {};

    // find remaining opened tags from start to end segment (incl)
    if (endSegment) {
      for (let i = 0; i <= endSegment.segmentIndex; i++) {
        const segment = this.text.segments[i];
        if (i !== endSegment.segmentIndex) {
          for (const tag of segment.openingTags) {
            tags[tag.tag] = true;
          }
          for (const tag of segment.closingTags) {
            tags[tag.tag] = false;
          }
        } else {
          const [segOpened, segClosed] = segment.getTagsForPosition(endSegment);
          for (const tag of segOpened) {
            tags[tag.tag] = true;
          }
          for (const tag of segClosed) {
            tags[tag.tag] = false;
          }
        }
      }  
    }

    // if this is range based request, add each tag(closing or opening) in this range
    if (startSegment && endSegment) {
      for (let i = startSegment.segmentIndex; i < endSegment.segmentIndex; i++) {
        const [segOpened, segClosed] = this.text.segments[i].getTagsForPosition(startSegment);
        for (const tag of segOpened) {
          tags[tag.tag] = true;
        }
        for (const tag of segClosed) {
          tags[tag.tag] = true;
        }
        //  console.log(startSegment, segOpened, segClosed)
      }  
    }

    return Object.keys(tags).filter(tag => tags[tag])
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
  }

  /**
   * draw resets the canvas and redraws the scene anew.
   * First draw lines with text, then allow each component to draw their own logic.
   * TODO - this should be done in conjunction with requestAnimationFrame
   */
  draw() {
    // @ts-ignore
    this.ctx.reset();
    this.ctx.font = this.font;

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

      this.cursor.draw(this.ctx, this.viewport, {
        lineHeight: this.lineHeight,
        charWidth: this.charWidth,
        charsAtLine: this.text.charsAtLine,
        mode: this.text.mode
      });
    }

    if (this.onSelectTextCb && this.cursor.isSelected()) {
      const [start, end] = this.cursor.getSelected();
      if (start && end) {
        const startSegment = this.text.getSegmentPosition( start.yLine, start.xLine) as SegmentPosition;
        const endSegment = this.text.getSegmentPosition( end.yLine, end.xLine) as SegmentPosition;
        const annotated = this.getAnnotations(startSegment, endSegment);
        this.onSelectTextCb({ text: this.text.getRangeText(start, end), anchors: annotated});
      }
    }

    if (this.onHighlightCb) {     
      const annotated = this.getAnnotations(null, this.text.cursorToIndex(this.viewport, this.cursor));
      if (annotated.length > 0) {
        const tag = annotated.pop() as string
        const highlight = this.onHighlightCb(tag);
        if (highlight) {
          const [startLine, endLine] = this.text.getTagPosition(tag)
          if (startLine && endLine) {
            this.ctx.strokeStyle = highlight.style.color;

            for (let currentYLine = startLine.yLine; currentYLine <= endLine.yLine; currentYLine++) {
              if (this.viewport.lineStart <= currentYLine && this.viewport.lineEnd >= currentYLine) {
                this.ctx.beginPath();

                const yPos = currentYLine - this.viewport.lineStart + this.lineHeight;
                if (currentYLine === startLine.yLine) {
                  this.ctx.moveTo(startLine.xLine, yPos);
                } else if (currentYLine === endLine.yLine) {
                  this.ctx.moveTo(endLine.xLine, yPos);
                } else {
                  this.ctx.moveTo(0, yPos);
                }

                if (startLine.yLine === endLine.yLine) {
                  this.ctx.lineTo(endLine.xLine * this.charWidth, yPos);
                } else if (currentYLine === startLine.yLine) {
                  this.ctx.lineTo(this.charWidth, yPos);
                } else if (currentYLine === endLine.yLine) {
                  this.ctx.lineTo(endLine.xLine * this.charWidth, yPos);
                }

                this.ctx.stroke();
              }
            }
          }
        }
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
  }

  /**
   * change display mode and recalculate drawn lines
   * @param mode 
   */
  setMode(mode: Mode) {
    this.element.classList.remove(this.text.mode)
    this.element.classList.add(mode)

    this.text.mode = mode;
    this.text.prepareSegments();
    this.text.calculateLines();
  }

  addAnchor(anchor: string) {
    if(!this.cursor.isSelected()) {
      return
    }

    const [start, end] = this.cursor.getSelected();
    if (start && end) {
      this.text.insertText(this.viewport, new Cursor(end.xLine, end.yLine - this.viewport.lineStart), `</${anchor}>`)
      this.text.insertText(this.viewport, new Cursor(start.xLine, start.yLine - this.viewport.lineStart), `<${anchor}>`)
      this.text.prepareSegments();
      this.text.calculateLines();
      this.draw();
    }
  }
}
