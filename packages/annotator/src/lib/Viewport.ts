/**
 * Viewport represents currently visible part of the canvas.
 * Uses absolute coordinates.
 */
export default class Viewport {
  lineStart: number;
  noLines: number;

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
   * scrollDown moves the viewport window down using step-lines.
   * Constraint is the provided second argument, which should represent last line.
   * @param step
   * @param maxLines
   */
  scrollDown(step: number, maxLines: number) {
    const move = Math.min(step, maxLines - this.lineStart - this.noLines);
    if (move > 0) {
      this.lineStart += move;
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
    }
  }
}
