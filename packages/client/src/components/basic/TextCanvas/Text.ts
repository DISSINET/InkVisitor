import Viewport from "./Viewport";
import Cursor from "./Cursor";

class Text {
  value: string;
  charsAtLine: number;

  constructor(value: string, charsAtLine: number) {
    this.value = value;
    this.charsAtLine = charsAtLine;
  }

  get length() {
    return this.value.length;
  }

  get noLines(): number {
    return 100;
  }

  get lines(): string[] {
    const time1 = performance.now();
    const words = this.value.split(" ");
    const lines = [];
    let currentLine: string[] = [];
    let currentLineLength = 0;
  
    words.forEach(word => {
      const wordLength = word.length;
  
      if (currentLineLength + wordLength > this.charsAtLine) {
        // Join the current line into a string and push it to lines
        lines.push(currentLine.join(' '));
        currentLine = [word]; // Start a new line with the current word
        currentLineLength = wordLength + 1; // Reset the length (+1 for the space)
      } else {
        currentLine.push(word);
        currentLineLength += wordLength + 1; // +1 for the space
      }
    });
  
    // Add the last line if it's not empty
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }
  
    const time2 = performance.now();
    console.log(`${time2 - time1} ms `);
  
    return lines;
  }

  // This method calculates the index of the text value at the start of given line
  lineToIndex(line: number): number {
    const lines = this.lines;
    let index = 0;
    for (let i = 0; i < line; i++) {
      index += lines[i].length + 1;
    }
    return index;
  }


  cursorToIndex(viewport: Viewport, cursor: Cursor): number {
return this.lineToIndex(cursor.y + viewport.lineStart) + cursor.x;
    }

  getViewportText(viewport: Viewport): string[] {
    const lineStart = viewport.lineStart;
    const lineEnd = lineStart + viewport.noLines;
    const lines = this.lines;
    return lines.slice(lineStart, lineEnd);
  }

  getCursorWord(cursor: Cursor): string {
    return "";
  }

  insertText(textToInsert: string, index: number): void {
    if (textToInsert.length === 1) {
    } else {
      //paste
    }
  }

  deleteText(
    viewport: Viewport,
    cursorPositionFrom: Cursor,
    cursorPositionTo: [number, number]
  ): void {
    const deleteFromI = this.cursorToIndex(viewport, cursorPositionFrom);
    this.value = this.value.slice(0, deleteFromI) + this.value.slice(deleteFromI + 1);

  }
}

export default Text;
