import { DEFAULT_FONT, DEFAULT_FONT_SIZE } from "./constants";
import Viewport from "./Viewport";

/**
 * Lines is canvas wrapper for writing no. lines
 */
export class Lines {
  // canvas element
  element: HTMLCanvasElement;
  // cached canvas contex
  ctx: CanvasRenderingContext2D;

  // font and lineHeight are seeded in the constructor and then re-copied from
  // the owning Annotator on every draw() — the Annotator's values are the truth.
  font: string;
  fontColor: string = "black";

  bgColor: string = "white";

  charWidth: number = 0;
  lineHeight: number;
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
    // Buffer-space line height (device px), same value the Annotator draws with.
    this.lineHeight = lineHeight;
    this.font = `${DEFAULT_FONT_SIZE * ratio}px ${DEFAULT_FONT}`;
  }

  /** Rows at absolute index < 0 or ≥ `contentLineCount` are blank in the gutter (e.g. the leading/trailing scroll buffer). */
  draw(viewport: Viewport, contentLineCount: number) {
    this.ctx.reset();

    this.width = this.element.width;
    this.height = this.element.height;

    // React inline styles update on theme change; read them so we repaint correctly
    // even when the annotator instance wasn’t updated via JS properties.
    const inlineBg = this.element.style.backgroundColor;
    const inlineFg = this.element.style.color;
    if (inlineBg) this.bgColor = inlineBg;
    if (inlineFg) this.fontColor = inlineFg;

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.translate(0, -viewport.scrollOffsetY);

    this.ctx.font = this.font;
    this.ctx.fillStyle = this.fontColor;
    this.ctx.textBaseline = "middle";

    const renderEndCond = viewport.lineEnd - viewport.lineStart;
    for (let row = 0; row <= renderEndCond; row++) {
      const absLine = viewport.lineStart + row;
      if (absLine < 0 || absLine >= contentLineCount) {
        continue;
      }
      // Same Y as Annotator.draw for each text row
      this.ctx.fillText(
        String(absLine + 1),
        0,
        (row + 0.5) * this.lineHeight
      );
    }

    this.ctx.restore();
  }
}
