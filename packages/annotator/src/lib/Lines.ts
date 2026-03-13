import { DEFAULT_FONT, DEFAULT_FONT_SIZE, LINE_HEIGHT } from "./constants";
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
  font: string = `${DEFAULT_FONT_SIZE}px ${DEFAULT_FONT}`;
  fontColor: string = "black";

  bgColor: string = "white";

  charWidth: number = 0;
  lineHeight: number = LINE_HEIGHT;

  // size for virtual area inside the canvas element
  width: number = 0;
  height: number = 0;

  constructor(
    element: HTMLCanvasElement,
    ratio: number,
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

    this.bgColor = this.element.style.backgroundColor || "white";
    this.fontColor = this.element.style.color || "black";

    this.charWidth = charWidth;
    this.lineHeight = lineHeight / ratio;
  }

  draw(viewport: Viewport) {
    this.ctx.reset();

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = this.font;
    this.ctx.fillStyle = this.fontColor;
    this.ctx.textBaseline = "middle";

    // Draw the same number of rows as the main text canvas.
    // Viewport.noLines is used as an "end index", so we add 1 to get
    // the number of visible rows.
    for (let renderLine = 1; renderLine <= viewport.noLines + 1; renderLine++) {
      this.ctx.fillText(
        (viewport.lineStart + renderLine).toString(),
        0,
        (renderLine - 0.5) * this.lineHeight
      );
    }
  }
}
