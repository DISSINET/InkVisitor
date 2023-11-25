/**
 * Cursor represents active position in the viewport
 */
export default class Cursor {
  x: number = -1;
  y: number = -1

  constructor() {
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor(y / lineHeight);
  };

  xToCharI(x: number, charWidth: number): number {
    return Math.floor(x / charWidth);
  };

  onMouseClick(e: MouseEvent, lineHeight: number, charWidth: number) {
    const [x, y] = [e.offsetX, e.offsetY];
    this.x = this.xToCharI(x, charWidth);
    this.y = this.yToLineI(y, lineHeight);
  }

  move(xDelta: number, yDelta: number) {
    if (this.x === -1 && this.y === -1 || (!xDelta && !yDelta)) {
      return
    }

    this.x += xDelta
    this.y += yDelta
  }

  draw(ctx: CanvasRenderingContext2D, lineHeight: number, charWidth: number) {
    if (this.x === -1 && this.y === -1) {
      return
    }

    ctx.fillRect(this.x * charWidth, this.y * lineHeight + 2, 3, lineHeight)
  }
}
