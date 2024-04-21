import { DrawingOptions } from "./Annotator";
import Viewport from "./Viewport";

// Absolute coordinates point to virtual position not limited by viewport - first line is first line of input
export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

// Relative coordinates point to position relative to viewport - first line is topmost rendered line
export interface IRelativeCoordinates extends IAbsCoordinates {}

/**
 * Cursor represents active position in the viewport with highlighting capabilities (marking start - end in absolute coordinates)
 */
export default class Cursor implements IRelativeCoordinates {
  // relative!
  xLine: number;
  yLine: number;

  fillColor: string;
  fillOpacity: number;

  // highlighted area must use absolute coordinates - highlighted area stays in position while scrolling
  private selecting: boolean = false;
  private selectStart?: IAbsCoordinates;
  private selectEnd?: IAbsCoordinates;

  // Width of cursor point in px
  static Width = 3
  
  constructor(xLine: number = -1, yLine: number = -1, fillColor = "blue", fillOpacity = 0.2) {
    this.fillColor = fillColor;
    this.fillOpacity = fillOpacity;
    this.xLine = xLine;
    this.yLine = yLine;
  }

  setFillColor(fillColor: string): void {
    this.fillColor = fillColor
  }
  setFillOpacity(fillOpacity: number): void {
    this.fillOpacity = fillOpacity
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor(y / lineHeight);
  }

  xToCharI(x: number, charWidth: number): number {
    return Math.floor(x / charWidth);
  }

  setPosition(
    evt: MouseEvent,
    lineHeight: number,
    charWidth: number
  ) {
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
   * getSelected is getter for absolute selected coordinates
   * @returns
   */
  getSelected(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
    return [this.selectStart, this.selectEnd];
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
    if ((this.xLine === -1 && this.yLine === -1) || (!xDelta && !yDelta)) {
      return;
    }

    this.xLine += xDelta;
    this.yLine += yDelta;
  }

  /**
   * move the cursor to start of the next line
   */
  moveToNewline() {
    this.xLine = 0;
    this.yLine += 1;
  }

  /**
   * drawLine is shorthand around drawing highlighted ares simply by providing relative coordinates
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
    const { charWidth, lineHeight } = options;

    ctx.fillRect(
      xStart * charWidth,
      relLine * lineHeight,
      (xEnd - xStart) * charWidth,
      lineHeight
    );
  }

  /**
   * draw places cursor and optionally highlighted area into the canvas
   * @param ctx
   * @param viewport
   * @param options
   * @returns
   */
  draw(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    options: DrawingOptions
  ) {
    if (this.xLine === -1 && this.yLine === -1) {
      return;
    }

    const { charWidth, lineHeight, charsAtLine } = options;

    ctx.fillStyle = options.mode === "highlight" ? "#cccccc" : "blue";

    ctx.fillRect(
      this.xLine * charWidth,
      this.yLine * lineHeight + 2,
      Cursor.Width,
      lineHeight
    );

    let [hStart, hEnd] = this.getSelected();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        const tmpSwitch = hStart;
        hStart = hEnd;
        hEnd = tmpSwitch;
      }
      ctx.fillStyle = this.fillColor;
      ctx.globalAlpha = this.fillOpacity;

      for (let i = 0; i <= viewport.lineEnd - viewport.lineStart; i++) {
        const absY = viewport.lineStart + i;
        if (hStart.yLine <= absY && hEnd.yLine >= absY) {
          // first line
          if (hStart.yLine === absY) {
            if (hStart.yLine === hEnd.yLine) {
              // ending line === starting line - fill only from start X -> end X
              this.drawLine(ctx, i, hStart.xLine, hEnd.xLine, options);
            } else {
              // not ending line - fill from up to the last character in the line
              this.drawLine(ctx, i, hStart.xLine, charsAtLine, options);
            }
            // last line
          } else if (hEnd.yLine === absY) {
            // fill from start to X position
            this.drawLine(ctx, i, 0, hEnd.xLine, options);
          } else {
            // not first/last line - fill completely
            this.drawLine(ctx, i, 0, charsAtLine, options);
          }
        }
      }

      ctx.globalAlpha = 1;
    }
  }
}