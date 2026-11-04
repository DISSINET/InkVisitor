import { DEFAULT_FONT, DEFAULT_FONT_SIZE } from "./constants";
import Viewport from "./Viewport";

/** Space (CSS px) between a right-aligned paragraph number and the text column. */
const NUMBER_GAP_PX = 8;
/** Space (CSS px) between the gutter's left edge and the widest number. */
const NUMBER_MARGIN_PX = 4;

/**
 * Lines is canvas wrapper for the gutter with paragraph numbers
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

  // widest digit advance (device px), keyed by the font it was measured in
  private digitWidthCache?: { font: string; width: number };

  /**
   * CSS px the gutter needs so numbers up to `maxNumber` fit at the current
   * font. Digit-count based, so it only changes at 10, 100, 1000... paragraphs.
   */
  requiredWidth(maxNumber: number): number {
    if (this.digitWidthCache?.font !== this.font) {
      this.ctx.font = this.font;
      let width = 0;
      for (let d = 0; d <= 9; d++) {
        width = Math.max(width, this.ctx.measureText(String(d)).width);
      }
      this.digitWidthCache = { font: this.font, width };
    }
    const digits = String(Math.max(1, maxNumber)).length;
    return (
      Math.ceil((digits * this.digitWidthCache.width) / this.ratio) +
      NUMBER_GAP_PX +
      NUMBER_MARGIN_PX
    );
  }

  /**
   * `paragraphNumberAt` gives the number to draw on an absolute visual line;
   * rows it returns undefined for (soft-wrapped continuations, the
   * leading/trailing scroll buffer) are blank in the gutter.
   */
  draw(viewport: Viewport, paragraphNumberAt: (absLine: number) => number | undefined) {
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
    // Right-aligned so numbers of any length end at the same x, next to the text.
    this.ctx.textAlign = "right";
    const x = this.width - NUMBER_GAP_PX * this.ratio;

    const renderEndCond = viewport.lineEnd - viewport.lineStart;
    for (let row = 0; row <= renderEndCond; row++) {
      const paragraphNumber = paragraphNumberAt(viewport.lineStart + row);
      if (paragraphNumber === undefined) {
        continue;
      }
      // Same Y as Annotator.draw for each text row
      this.ctx.fillText(String(paragraphNumber), x, (row + 0.5) * this.lineHeight);
    }

    this.ctx.restore();
  }
}
