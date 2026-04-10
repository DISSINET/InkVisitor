/**
 * Viewport represents currently visible part of the canvas.
 * Uses absolute coordinates.
 * scrollOffsetY is the pixel offset for fluent scrolling (0 to lineHeight); content is drawn at -scrollOffsetY.
 */
export default class Viewport {
  lineStart: number;
  noLines: number;
  /** Pixel offset for smooth scroll (same units as line height). Content is translated by -scrollOffsetY. */
  scrollOffsetY: number = 0;

  constructor(lineStart: number, lineEnd: number) {
    this.lineStart = lineStart;
    this.noLines = lineEnd;
  }

  get lineEnd(): number {
    return this.lineStart + this.noLines;
  }

  /**
   * setting a new lineStart value
   * @param lineEnd new lineEnd value
   */
  updateLineEnd(lineEnd: number) {
    this.noLines = lineEnd;
  }

  /**
   * Accumulates pixel delta for fluent scrolling. Updates lineStart when scrollOffsetY crosses line boundaries.
   * @param deltaY Pixel delta (e.g. wheel event deltaY in buffer/canvas units).
   * @param lineHeight Line height in the same units as deltaY.
   * @param maxLines Maximum line index (total line count).
   */
  addScrollOffset(deltaY: number, lineHeight: number, maxLines: number) {
    this.scrollOffsetY += deltaY;
    // maxLines is a total line count; the last valid line index is (maxLines - 1)
    const maxStart = Math.max(0, maxLines - 1 - this.noLines);
    while (this.scrollOffsetY >= lineHeight && this.lineStart < maxStart) {
      this.scrollOffsetY -= lineHeight;
      this.lineStart += 1;
    }
    while (this.scrollOffsetY < 0 && this.lineStart > 0) {
      this.scrollOffsetY += lineHeight;
      this.lineStart -= 1;
    }
    this.scrollOffsetY = Math.max(0, Math.min(this.scrollOffsetY, lineHeight - 1));
  }

  /**
   * scrollDown moves the viewport window down using step-lines.
   * Constraint is the provided second argument, which should represent last line.
   * @param step
   * @param maxLines
   */
  scrollDown(step: number, maxLines: number) {
    // maxLines is a total line count; the last valid line index is (maxLines - 1)
    const maxStart = Math.max(0, maxLines - 1 - this.noLines);
    const move = Math.min(step, maxStart - this.lineStart);
    if (move > 0) {
      this.lineStart += move;
      this.scrollOffsetY = 0;
    }
  }

  /**
   * scrollUp moves the viewport window up using step-lines.
   * Constraint is the first line.
   * @param step
   */
  scrollUp(step: number) {
    if (this.lineStart - step >= 0) {
      this.lineStart -= step;
    } else {
      this.lineStart = 0;
    }
    this.scrollOffsetY = 0;
  }

  /**
   * ScrollTo wraps scrollUp/scrollDown methods to enable moving to specific coordinates
   * @param textLine
   * @param maxLines
   */
  scrollTo(lineTo: number, maxLines: number) {
    const lineFrom = this.lineStart;
    if (lineTo > this.lineStart) {
      this.scrollDown(lineTo - lineFrom, maxLines);
    } else if (lineTo < lineFrom) {
      this.scrollUp(lineFrom - lineTo);
    } else {
      this.scrollOffsetY = 0;
    }
  }

  /**
   * Sets scroll position with sub-line pixel offset (for fluent scroll bar).
   * Clamps lineStart and scrollOffsetY to valid ranges.
   */
  setScrollPosition(
    lineStart: number,
    scrollOffsetY: number,
    lineHeight: number,
    maxLines: number
  ) {
    // maxLines is a total line count; the last valid line index is (maxLines - 1)
    const maxStart = Math.max(0, maxLines - 1 - this.noLines);
    this.lineStart = Math.max(0, Math.min(maxStart, Math.floor(lineStart)));
    const frac = lineStart - this.lineStart;
    this.scrollOffsetY = Math.max(
      0,
      Math.min(lineHeight - 1, frac * lineHeight)
    );
  }
}
