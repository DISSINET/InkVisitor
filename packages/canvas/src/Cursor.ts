export interface IAbsCoordinates {
  xLine: number;
  yLine: number;
}

/**
 * Cursor represents active position in the viewport
 */
export default class Cursor implements IAbsCoordinates {
  xLine: number = -1;
  yLine: number = -1
  highlighting?: boolean;
  highlightStart?: IAbsCoordinates;
  highlightEnd?: IAbsCoordinates;

  constructor() {
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor(y / lineHeight);
  };

  xToCharI(x: number, charWidth: number): number {
    return Math.floor(x / charWidth);
  };

  setPosition(offsetX: number, offsetY: number, lineHeight: number, charWidth: number) {
    this.xLine = this.xToCharI(offsetX, charWidth);
    this.yLine = this.yToLineI(offsetY, lineHeight);
  }

  startHighlight() {
    if (!this.highlighting) {
      this.highlightStart = { xLine: this.xLine, yLine: this.yLine }
      this.highlightEnd = undefined;
      this.highlighting = true
    } else {
      this.highlightEnd = { xLine: this.xLine, yLine: this.yLine }  
    }
  }

  endHighlight() {
    this.highlighting = false
  }

  move(xDelta: number, yDelta: number) {
    if (this.xLine === -1 && this.yLine === -1 || (!xDelta && !yDelta)) {
      return
    }

    this.xLine += xDelta
    this.yLine += yDelta
  }

  draw(ctx: CanvasRenderingContext2D, lineHeight: number, charWidth: number) {
    if (this.xLine === -1 && this.yLine === -1) {
      return
    }

    ctx.fillRect(this.xLine * charWidth, this.yLine * lineHeight + 2, 3, lineHeight)
  }
}
