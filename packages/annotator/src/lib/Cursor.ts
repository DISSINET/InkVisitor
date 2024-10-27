import { DrawingOptions } from "./Annotator";
import Text from "./Text";
import Viewport from "./Viewport";
import { Modes } from "./constants";

// Absolute coordinates point to virtual position not limited by viewport - first line is first line of input
export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

export interface CursorStyle {
  selection: {
    fill: string;
    fillOpacity: number;
  };
  cursor: {
    highlightFill: string;
    defaultFill: string;
  };
}

const defaultStyle: CursorStyle = {
  selection: {
    fill: "blue",
    fillOpacity: 0.2,
  },
  cursor: {
    highlightFill: "black",
    defaultFill: "blue",
  },
};

// Relative coordinates point to position relative to viewport - first line is topmost rendered line
export interface IRelativeCoordinates extends IAbsCoordinates {}

/**
 * Cursor represents active position in the viewport with highlighting capabilities (marking start - end in absolute coordinates)
 */
export default class Cursor implements IRelativeCoordinates {
  // relative!
  xLine: number;
  yLine: number;
  ratio: number;

  style: CursorStyle;

  // highlighted area must use absolute coordinates - highlighted area stays in position while scrolling
  private selecting: boolean = false;
  selectStart?: IAbsCoordinates;
  selectEnd?: IAbsCoordinates;

  // Width of cursor point in px
  static Width = 3;

  constructor(
    ratio: number,
    xLine: number = -1,
    yLine: number = -1,
    style: Partial<CursorStyle> = defaultStyle
  ) {
    this.style = { ...defaultStyle, ...style };

    this.ratio = ratio;
    this.xLine = xLine;
    this.yLine = yLine;
  }

  /**
   * @param style
   * sets the style of the cursor
   */
  setStyle(style: Partial<CursorStyle>) {
    this.style = { ...this.style, ...style };
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor((y / lineHeight) * this.ratio);
  }

  xToCharI(x: number, charWidth: number): number {
    return Math.floor((Math.max(x, 0) / charWidth) * this.ratio);
  }

  setPosition(lineX: number, lineY: number) {
    this.xLine = lineX;
    this.yLine = lineY;
  }

  setPositionFromEvent(evt: MouseEvent, lineHeight: number, charWidth: number) {
    this.xLine = this.xToCharI(evt.offsetX, charWidth);
    this.yLine = this.yToLineI(evt.offsetY, lineHeight);
  }

  /**
   * isSelecting is predicate for testing if any mouse-move event should update selected area (click+move)
   * @returns
   */
  isSelecting(): boolean {
    return this.selecting;
  }

  /**
   * isSelected is predicate for testing if selected area has been set - should be drawn
   * @returns
   */
  isSelected(): boolean {
    return !!this.selectStart && !!this.selectEnd;
  }

  /**
   * getSelectedArea return null if area is empty (no char selected)
   * @returns
   */
  getSelectedArea(): [IAbsCoordinates, IAbsCoordinates] | null {
    const selected = this.getSelected();
    if (
      selected[0] === undefined ||
      selected[1] === undefined ||
      (selected[0].xLine === selected[1].xLine &&
        selected[0].yLine === selected[1].yLine)
    ) {
      return null;
    }

    return [selected[0], selected[1]];
  }

  /**
   * getSelected is getter for absolute selected coordinates
   * @returns
   */
  getSelected(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
    if (!this.selectStart || !this.selectEnd) {
      return [undefined, undefined];
    }

    if (
      this.selectStart.yLine < this.selectEnd.yLine ||
      (this.selectStart.yLine === this.selectEnd.yLine &&
        this.selectStart.xLine < this.selectEnd.xLine)
    ) {
      return [this.selectStart, this.selectEnd];
    } else {
      return [this.selectEnd, this.selectStart];
    }
  }

  /**
   * selectArea updates selected area's coordinates, either both start/end (set initial position) or just end (moving)
   * @param yOffset
   */
  selectArea(yOffset: number) {
    if (!this.selecting) {
      this.selectStart = { xLine: this.xLine, yLine: yOffset + this.yLine };
      this.selectEnd = { xLine: this.xLine, yLine: yOffset + this.yLine };
      this.selecting = true;
    } else {
      this.selectEnd = { xLine: this.xLine, yLine: yOffset + this.yLine };
    }
  }

  /**
   * endHighlight marks final position for highlighted area by setting control flag to false
   */
  endHighlight() {
    this.selecting = false;
  }

  /**
   * move alters the cursor position by provided delta increments
   * @param xDelta
   * @param yDelta
   * @returns
   */
  move(xDelta: number, yDelta: number) {
    if (!xDelta && !yDelta) {
      return;
    }

    let newX = this.xLine + xDelta;
    let newY = this.yLine + yDelta;

    if (newX < 0) {
      newX = 0;
    }
    if (newY < 0) {
      newY = 0;
    }

    this.xLine = newX;
    this.yLine = newY;
  }

  /**
   * move the cursor to start of the next line
   */
  moveToNewline() {
    this.xLine = 0;
    this.yLine += 1;
  }

  /**
   * drawLine is shorthand around drawing highlighted areas simply by providing relative coordinates
   * @param ctx
   * @param relLine
   * @param xStart
   * @param xEnd
   * @param options
   */
  drawLine(
    ctx: CanvasRenderingContext2D,
    relLine: number,
    xStart: number,
    xEnd: number,
    options: DrawingOptions
  ) {
    const hlMode = options.schema?.mode;
    const { charWidth, lineHeight } = options;
    const width = (xEnd - xStart) * charWidth;
    const height = hlMode === "underline" ? 2 : lineHeight;

    if (hlMode === "focus") {
      ctx.globalCompositeOperation = "xor";
      ctx.fillRect(xStart * charWidth, relLine * lineHeight, width, height);
    } else if (hlMode === "underline") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(
        xStart * charWidth,
        (relLine + 1) * lineHeight,
        width,
        height
      );
    } else if (hlMode === "background") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(xStart * charWidth, relLine * lineHeight, width, height);
    }
  }

  /**
   * draw places cursor and optionally highlighted area into the canvas
   * @param ctx
   * @param viewport
   * @param text
   * @param options
   * @returns
   */
  draw(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    textLines: string[],
    options: DrawingOptions
  ) {
    if (this.xLine === -1 && this.yLine === -1) {
      return;
    }

    const { charWidth, lineHeight, charsAtLine, schema } = options;

    const hlMode = schema?.mode;

    ctx.fillStyle =
      options.mode === Modes.HIGHLIGHT
        ? this.style.cursor.highlightFill
        : this.style.cursor.defaultFill;

    if (!options.schema) {
      ctx.fillRect(
        this.xLine * charWidth,
        this.yLine * lineHeight + 2,
        Cursor.Width,
        lineHeight
      );
    }

    let [hStart, hEnd] = this.getSelected();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        [hStart, hEnd] = [hEnd, hStart];
      }

      const rowsToDraw: { rowI: number; start: number; end: number }[] = [];

      for (let i = 0; i <= viewport.lineEnd - viewport.lineStart; i++) {
        const absY = viewport.lineStart + i;

        if (hlMode === "focus") {
          if (absY < hStart.yLine || absY > hEnd.yLine) {
            rowsToDraw.push({ rowI: i, start: 0, end: charsAtLine });
          }
          if (absY === hStart.yLine) {
            rowsToDraw.push({ rowI: i, start: 0, end: charsAtLine });
          }
          if (absY === hEnd.yLine) {
            rowsToDraw.push({
              rowI: i,
              start: hEnd.xLine,
              end: charsAtLine,
            });
          }
        } else {
          if (hStart.yLine <= absY && hEnd.yLine >= absY) {
            if (hStart.yLine === absY) {
              rowsToDraw.push({
                rowI: i,
                start: hStart.xLine,
                end:
                  hStart.yLine === hEnd.yLine
                    ? hEnd.xLine
                    : textLines[absY].length,
              });
            } else if (hEnd.yLine === absY) {
              rowsToDraw.push({ rowI: i, start: 0, end: hEnd.xLine });
            } else {
              rowsToDraw.push({
                rowI: i,
                start: 0,
                end: textLines[absY].length,
              });
            }
          }
        }
      }

      ctx.fillStyle = options.schema?.style.color || this.style.selection.fill;

      ctx.globalAlpha =
        options.schema?.style.opacity || this.style.selection.fillOpacity;

      for (const row of rowsToDraw) {
        this.drawLine(ctx, row.rowI, row.start, row.end, options);
      }
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Reset the cursor properties - removes highlighting / cursor pointer
   */
  reset() {
    this.selectStart = undefined;
    this.selectEnd = undefined;
    this.xLine = -1;
    this.yLine = -1;
  }

  static fromPosition(pos: IAbsCoordinates): Cursor {
    return new Cursor(0, pos.xLine, pos.yLine);
  }
}
