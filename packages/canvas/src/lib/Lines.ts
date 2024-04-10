import Viewport from "./Viewport";

/**
 * Lines is canvas wrapper for writing no. lines
 */
export class Lines {
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

  constructor(
    element: HTMLCanvasElement,
    lineHeight: number,
    charWidth: number
  ) {
    this.element = element;
    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context");
    }
    this.ctx = ctx;
    this.width = this.element.width;
    this.height = this.element.height;
    this.charWidth = charWidth;
    this.lineHeight = lineHeight;
  }

  draw(viewport: Viewport) {
    // @ts-ignore
    this.ctx.reset();
    this.ctx.font = this.font;
    for (
      let renderLine = 1;
      renderLine <= viewport.lineEnd - viewport.lineStart;
      renderLine++
    ) {
      this.ctx.fillText(
        (viewport.lineStart + renderLine).toString(),
        0,
        renderLine * this.lineHeight
      );
    }
  }
}