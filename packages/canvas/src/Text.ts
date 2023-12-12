import Viewport from "./Viewport";
import Cursor, { IAbsCoordinates } from "./Cursor";

/**
 * Text provides more abstract control over the provided raw text
 */
class Text {
  value: string;
  charsAtLine: number;
  _lines: string[] = [];

  constructor(value: string, charsAtLine: number) {
    this.value = value;
    this.charsAtLine = charsAtLine;
    this.calculateLines();
  }

  get length() {
    return this.value.length;
  }

  get noLines(): number {
    return 100;
  }

  get lines(): string[] {
    return this._lines;
  }

  /**
   * calculateLines processes the raw text by splitting it into lines
   * TODO provide more optimized approach so this method does not have to recalculate everyting after writing single characted
   */
  calculateLines(): void {
    const time1 = performance.now();
    const words = this.value.split(" ");
    const lines = [];
    let currentLine: string[] = [];
    let currentLineLength = 0;

    words.forEach((word) => {
      const wordLength = word.length;

      if (currentLineLength + wordLength > this.charsAtLine) {
        // Join the current line into a string and push it to lines
        lines.push(currentLine.join(" "));
        currentLine = [word]; // Start a new line with the current word
        currentLineLength = wordLength + 1; // Reset the length (+1 for the space)
      } else {
        currentLine.push(word);
        currentLineLength += wordLength + 1; // +1 for the space
      }
    });

    // Add the last line if it's not empty
    if (currentLine.length > 0) {
      lines.push(currentLine.join(" "));
    }

    const time2 = performance.now();
    console.log(`${time2 - time1} ms `);

    this._lines = lines;
  }

  /**
   * lineToIndex calculates the index of the text value at the start of given line
   * @param line
   * @returns
   */
  lineToIndex(line: number): number {
    const lines = this.lines;
    let index = 0;
    for (let i = 0; i < line; i++) {
      index += lines[i].length + 1;
    }
    return index;
  }

  /**
   * cursorToIndex calculates index position of the text from cursor position
   * @param line
   * @returns
   */
  cursorToIndex(viewport: Viewport, cursor: Cursor): number {
    return (
      this.lineToIndex(cursor.yLine + viewport.lineStart) + cursor.xLine - 1
    );
  }

  /**
   * getViewportText returns visible text to be rendered by Viewport
   * @param viewport
   * @returns
   */
  getViewportText(viewport: Viewport): string[] {
    const lineStart = viewport.lineStart;
    const lineEnd = lineStart + viewport.noLines;
    const lines = this.lines;
    return lines.slice(lineStart, lineEnd);
  }

  /**
   * getCursorWord returns current word under active cursor
   * @param cursor
   * @returns
   */
  getCursorWord(cursor: Cursor): string {
    return "";
  }

  /**
   * insertText adds text to cursor position
   * @param viewport
   * @param cursorPosition
   * @param textToInsert
   */
  insertText(
    viewport: Viewport,
    cursorPosition: Cursor,
    textToInsert: string
  ): void {
    const insertAtI = this.cursorToIndex(viewport, cursorPosition);
    this.value =
      this.value.slice(0, insertAtI + 1) +
      textToInsert +
      this.value.slice(insertAtI + 1);
    this.calculateLines();
  }

  /**
   * deleteText removes specific number of charactes from cursor position
   * @param viewport
   * @param cursorPosition
   * @param chartsToDelete
   */
  deleteText(
    viewport: Viewport,
    cursorPosition: Cursor,
    chartsToDelete: number
  ): void {
    const deleteFromI = this.cursorToIndex(viewport, cursorPosition);
    this.value =
      this.value.slice(0, deleteFromI) +
      this.value.slice(deleteFromI + chartsToDelete);

    this.calculateLines();
  }

  /**
   * getRangeText returns text delimited by provided absolute range
   * @param start
   * @param end
   * @returns
   */
  getRangeText(start: IAbsCoordinates, end: IAbsCoordinates): string {
    // swap in case start is after end
    if (
      start.yLine > end.yLine ||
      (start.yLine === end.yLine && start.xLine > end.xLine)
    ) {
      const tempStart = start;
      start = end;
      end = tempStart;
    }

    const rangeLines = this.lines.slice(start.yLine, end.yLine + 1);
    const linesSize = rangeLines.length;
    rangeLines[linesSize - 1] = rangeLines[linesSize - 1].slice(0, end.xLine);
    rangeLines[0] = rangeLines[0].slice(start.xLine, rangeLines[0].length + 1);
    return rangeLines.join("\n");
  }
}

export default Text;
