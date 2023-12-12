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
   * scrollDown moves the viewport window down using step-lines.
   * Constraint is the provided second argument, which should represent last line.
   * @param step
   * @param maxLines
   */
  scrollDown(step: number, maxLines: number) {
    if (this.lineStart + this.noLines + step < maxLines) {
      this.lineStart += step;
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
    }
  }

  /**
   * ScrollTo wraps scrollUp/scrollDown methods to enable moving to specific coordinates
   * @param textLine
   * @param maxLines
   */
  scrollTo(textLine: number, maxLines: number) {
    if (textLine > this.lineStart) {
      this.scrollDown(textLine - this.lineStart, maxLines);
    } else if (textLine < this.lineStart) {
      this.scrollUp(this.lineStart - textLine);
    }
  }
}
