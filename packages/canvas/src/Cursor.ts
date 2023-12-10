import { DrawingOptions } from "./Canvas";
import Text from "./Text";
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

  getHighlighted(): [IAbsCoordinates | undefined, IAbsCoordinates | undefined] {
    return [this.highlightStart, this.highlightEnd];
  }

  startHighlight() {
    if (!this.highlighting) {
      this.highlightStart = { xLine: this.xLine, yLine: this.yLine };
      this.highlightEnd = { xLine: this.xLine, yLine: this.yLine };
      this.highlighting = true;
    } else {
      this.highlightEnd = { xLine: this.xLine, yLine: this.yLine };
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
      3,
      lineHeight
    );

    const [hStart, hEnd] = this.getHighlighted();

    if (hStart && hEnd) {
      ctx.fillStyle = "blue";
      ctx.globalAlpha = 0.2;

      for (let i = 0; i <= viewport.lineEnd - viewport.lineStart; i++) {
        const currentAbsLine = viewport.lineStart + i;
        if (hStart.yLine <= currentAbsLine && hEnd.yLine >= currentAbsLine) {
          // first line
          if (hStart.yLine === currentAbsLine) {
            if (hStart.yLine === hEnd.yLine) {
              // ending line === starting line - fill only from start X -> end X
              ctx.fillRect(
                hStart.xLine * charWidth,
                i * lineHeight,
                (hEnd.xLine - hStart.xLine) * charWidth,
                lineHeight
              );
            } else {
              // not ending line - fill from up to the last character in the line
              ctx.fillRect(
                hStart.xLine * charWidth,
                i * lineHeight,
                charWidth * charsAtLine,
                lineHeight
              );
            }
            // last line
          } else if (hEnd.yLine === currentAbsLine) {
            // fill from start to X position
            ctx.fillRect(0, i * lineHeight, hEnd.xLine * charWidth, lineHeight);
          } else {
            // not first/last line - fill completely
            ctx.fillRect(
              0,
              i * lineHeight,
              charWidth * charsAtLine,
              lineHeight
            );
          }
        }
      }

      ctx.globalAlpha = 1;
    }
  }
}
