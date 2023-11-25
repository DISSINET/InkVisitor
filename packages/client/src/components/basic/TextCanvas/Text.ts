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
    return this.value.split("\n");
  }

  getViewportText(viewport: Viewport): string[] {
    console.log("getViewportText", viewport);

    const time1 = performance.now();
    const words = this.value.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length > this.charsAtLine) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });

    // Adding the last line if it's not empty
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    const lineStart = viewport.lineStart;
    const lineEnd = lineStart + viewport.noLines;
    const time2 = performance.now();

    console.log(`${time2 - time1} ms `);

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
    cursorPositionFrom: [number, number],
    cursorPositionTo: [number, number]
  ): void {}
}

export default Text;
