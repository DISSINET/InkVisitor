import { DrawingOptions } from "./Annotator";
import Viewport from "./Viewport";
import { EditMode, HighlightMode } from "./constants";

// Absolute coordinates point to virtual position not limited by viewport - first line is first line of input
export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

export interface CursorStyle {
  color: string;
  opacity: number;
}

const defaultStyle: CursorStyle = {
  color: "black",
  opacity: 0.7,
};

// Relative coordinates point to position relative to viewport - first line is topmost rendered line
export interface IRelativeCoordinates extends IAbsCoordinates {}

/**
 * Cursor represents active position in the viewport with highlighting capabilities (marking start - end in absolute coordinates)
 */
export default class Highlighter {
  ratio: number;

  style: CursorStyle;

  hlMode: HighlightMode;

  selectStart?: IAbsCoordinates;
  selectEnd?: IAbsCoordinates;

  constructor(
    ratio: number,
    style: Partial<CursorStyle> = defaultStyle,
    hlMode: HighlightMode = HighlightMode.SELECT
  ) {
    this.style = { ...defaultStyle, ...style };
    this.hlMode = hlMode;

    this.ratio = ratio;
  }

  /**
   * @param style
   * sets the style of the cursor
   */
  setStyle(style: Partial<CursorStyle>) {
    this.style = { ...this.style, ...style };
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.round((y / lineHeight) * this.ratio - 1);
  }

  xToCharI(x: number, charWidth: number): number {
    return Math.floor((Math.max(x, 0) / charWidth) * this.ratio);
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
    const { charWidth, lineHeight } = options;
    const width = (xEnd - xStart) * charWidth;
    const height = this.hlMode === HighlightMode.UNDERLINE ? 3 : lineHeight;

    ctx.fillStyle = this.style.color;
    ctx.globalAlpha = this.style.opacity;

    if (this.hlMode === "focus") {
      ctx.globalCompositeOperation = "xor";
      ctx.fillRect(xStart * charWidth, relLine * lineHeight, width, height);
    } else if (this.hlMode === "underline") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(
        xStart * charWidth,
        (relLine + 1) * lineHeight,
        width,
        height
      );
    } else if (this.hlMode === "background") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(xStart * charWidth, relLine * lineHeight, width, height);
    } else if (this.hlMode === "select") {
      ctx.globalCompositeOperation = "color";
      ctx.fillRect(xStart * charWidth, relLine * lineHeight, width, height);

      ctx.fillStyle = "black";
      ctx.globalAlpha = 1;
      ctx.fillRect(xEnd * charWidth, relLine * lineHeight, 1, lineHeight);
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
    drawingOptions: DrawingOptions,
    editMode: EditMode
  ) {
    const { charsAtLine } = drawingOptions;

    let [hStart, hEnd] = this.getSelected();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        [hStart, hEnd] = [hEnd, hStart];
      }

      const rowsToDraw: { rowI: number; start: number; end: number }[] = [];

      for (
        let i = 0;
        i < Math.min(viewport.lineEnd, textLines.length) - viewport.lineStart;
        i++
      ) {
        const currY = viewport.lineStart + i;
        const lastCharX = textLines[currY].length;

        if (this.hlMode === "focus") {
          if (currY < hStart.yLine || currY > hEnd.yLine) {
            rowsToDraw.push({ rowI: i, start: 0, end: charsAtLine });
          }
          if (currY === hStart.yLine) {
            rowsToDraw.push({ rowI: i, start: 0, end: hStart.xLine });
          }
          if (currY === hEnd.yLine) {
            rowsToDraw.push({
              rowI: i,
              start: lastCharX,
              end: hEnd.xLine,
            });
          }
        } else {
          if (hStart.yLine <= currY && hEnd.yLine >= currY) {
            if (hStart.yLine === currY) {
              rowsToDraw.push({
                rowI: i,
                start: hStart.xLine,
                end: hStart.yLine === hEnd.yLine ? hEnd.xLine : lastCharX,
              });
            } else if (hEnd.yLine === currY) {
              rowsToDraw.push({ rowI: i, start: 0, end: hEnd.xLine });
            } else {
              rowsToDraw.push({
                rowI: i,
                start: 0,
                end: lastCharX,
              });
            }
          }
        }
      }

      for (const row of rowsToDraw) {
        this.drawLine(ctx, row.rowI, row.start, row.end, drawingOptions);
        //this.xLine = row.end
        // this.yLine = row.rowI
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
  }
}
