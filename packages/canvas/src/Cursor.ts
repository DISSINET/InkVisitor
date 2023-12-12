import { DrawingOptions } from "./Canvas";
import Viewport from "./Viewport";

export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

/**
 * Cursor represents active position in the viewport
 */
export default class Cursor implements IAbsCoordinates {
  xLine: number = -1;
  yLine: number = -1;
  private highlighting: boolean = false;
  private highlightStart?: IAbsCoordinates;
  private highlightEnd?: IAbsCoordinates;

  static Width = 3;

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor(y / lineHeight);
  }

  xToCharI(x: number, charWidth: number): number {
    return Math.floor(x / charWidth);
  }

  setPosition(
    offsetX: number,
    offsetY: number,
    lineHeight: number,
    charWidth: number
  ) {
    this.xLine = this.xToCharI(offsetX, charWidth);
    this.yLine = this.yToLineI(offsetY, lineHeight);
  }

  isHighlighting(): boolean {
    return this.highlighting;
  }

  isHighlighted(): boolean {
    return !!this.highlightStart && !!this.highlightEnd;
  }

  getHighlighted(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
    return [this.highlightStart, this.highlightEnd];
  }

  highlight(yOffset: number) {
    if (!this.highlighting) {
      this.highlightStart = { xLine: this.xLine, yLine: yOffset + this.yLine };
      this.highlightEnd = { xLine: this.xLine, yLine: yOffset + this.yLine };
      this.highlighting = true;
    } else {
      this.highlightEnd = { xLine: this.xLine, yLine: yOffset + this.yLine };
    }
  }

  endHighlight() {
    this.highlighting = false;
  }

  move(xDelta: number, yDelta: number) {
    if ((this.xLine === -1 && this.yLine === -1) || (!xDelta && !yDelta)) {
      return;
    }

    this.xLine += xDelta;
    this.yLine += yDelta;
  }

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

  draw(
    ctx: CanvasRenderingContext2D,
    viewport: Viewport,
    options: DrawingOptions
  ) {
    if (this.xLine === -1 && this.yLine === -1) {
      return;
    }

    const { charWidth, lineHeight, charsAtLine } = options;

    ctx.fillRect(
      this.xLine * charWidth,
      this.yLine * lineHeight + 2,
      Cursor.Width,
      lineHeight
    );

    let [hStart, hEnd] = this.getHighlighted();
    if (hStart && hEnd) {
      if (hStart.yLine > hEnd.yLine) {
        const tmpSwitch = hStart;
        hStart = hEnd;
        hEnd = tmpSwitch;
      }
      ctx.fillStyle = "blue";
      ctx.globalAlpha = 0.2;

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
