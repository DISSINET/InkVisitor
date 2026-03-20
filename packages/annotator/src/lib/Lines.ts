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
  ratio: number = 1;

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
    this.ratio = ratio;
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
    // Buffer-space line height (LINE_HEIGHT * ratio), same as Annotator.
    this.lineHeight = lineHeight;
    this.font = `${DEFAULT_FONT_SIZE * ratio}px ${DEFAULT_FONT}`;
  }

  draw(viewport: Viewport) {
    this.ctx.reset();

    this.width = this.element.width;
    this.height = this.element.height;

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(0, -viewport.scrollOffsetY);

    this.ctx.font = this.font;
    this.ctx.fillStyle = this.fontColor;
    this.ctx.textBaseline = "middle";

    const renderEndCond = viewport.lineEnd - viewport.lineStart;
    for (let row = 0; row <= renderEndCond; row++) {
      // Same Y as Annotator.draw for each text row
      this.ctx.fillText(
        String(viewport.lineStart + row + 1),
        0,
        (row + 0.5) * this.lineHeight
      );
    }

    this.ctx.restore();
  }
}
