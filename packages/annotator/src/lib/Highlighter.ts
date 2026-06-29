import { DrawingOptions } from "./Annotator";
import Text from "./Text";
import Viewport from "./Viewport";
import {
  HIGHLIGHT_HEIGHT_RATIO,
  HighlightMode,
  UNDERLINE_OFFSET_PX,
} from "./constants";

// Absolute coordinates point to virtual position not limited by viewport - first line is first line of input
export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

export interface CursorStyle {
  color: string;
  opacity: number;
  selectorColor: string;
}

export const defaultStyle: CursorStyle = {
  color: "black",
  opacity: 0.7,
  selectorColor: "black",
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
    return Math.max(0, Math.floor((y / lineHeight) * this.ratio));
  }

  xToCharI(x: number, charWidth: number): number {
    const rel = (Math.max(x, 0) / charWidth) * this.ratio;
    // Place caret to the right when clicking on the right half of a character cell
    return Math.floor(rel + 0.5);
  }

  /**
   * getSelected is getter for absolute selected coordinates
   * @returns
   */
  getAbsBounds(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
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
    options: DrawingOptions,
    absLine?: number
  ) {
    const { charWidth, lineHeight, color: colorOverride, columnToPixelX } =
      options;
    // Proportional uses measured widths keyed by the ABSOLUTE line;
    // monospace (no resolver / no absLine) keeps the exact `col * charWidth` grid.
    const toPx =
      columnToPixelX && absLine !== undefined
        ? (col: number) => columnToPixelX(absLine, col)
        : (col: number) => col * charWidth;
    const xStartPx = toPx(xStart);
    const width = toPx(xEnd) - xStartPx;
    // const height = this.hlMode === HighlightMode.UNDERLINE ? 3 : lineHeight;

    const isNarrowHighlight =
      this.hlMode === HighlightMode.SELECT ||
      this.hlMode === HighlightMode.BACKGROUND;
    const height =
      this.hlMode === HighlightMode.UNDERLINE
        ? 3
        : isNarrowHighlight
        ? Math.max(1, lineHeight * HIGHLIGHT_HEIGHT_RATIO)
        : lineHeight;
    const yOffset = isNarrowHighlight ? (lineHeight - height) / 2 : 0;
    const y = relLine * lineHeight + yOffset;

    ctx.fillStyle = colorOverride || this.style.color;
    ctx.globalAlpha = this.style.opacity;

    if (this.hlMode === "focus") {
      ctx.globalCompositeOperation = "xor";
      ctx.fillRect(xStartPx, relLine * lineHeight, width, lineHeight);
    } else if (this.hlMode === "underline") {
      ctx.globalCompositeOperation = "multiply";
      const offsetPx = UNDERLINE_OFFSET_PX * this.ratio;
      const underlineY = (relLine + 1) * lineHeight - height - offsetPx;
      ctx.fillRect(xStartPx, underlineY, width, height);
    } else if (this.hlMode === "background") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(xStartPx, y, width, height);
    } else if (this.hlMode === "select") {
      ctx.globalCompositeOperation = "color";
      // width === 0 means a collapsed caret; honor the configured caret width.
      ctx.fillRect(xStartPx, y, width || options.caretWidth || 1, height);
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
    text: Text,
    drawingOptions: DrawingOptions
  ) {
    const { charsAtLine } = drawingOptions;

    let [hStart, hEnd] = this.getAbsBounds();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        [hStart, hEnd] = [hEnd, hStart];
      }

      const rowsToDraw: { rowI: number; start: number; end: number }[] = [];

      // Use the same line count as the main text renderer to avoid off-by-one
      // issues where the last visible line has no highlight.
      const visibleLinesCount =
        Math.min(viewport.lineEnd, text.noLines) - viewport.lineStart;

      for (let i = 0; i <= visibleLinesCount; i++) {
        const currY = viewport.lineStart + i;
        const lastCharX = text.getLine(currY).length;

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
        this.drawLine(
          ctx,
          row.rowI,
          row.start,
          row.end,
          drawingOptions,
          viewport.lineStart + row.rowI
        );
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
