import Viewport  from "./Viewport";
import Cursor from "./Cursor";

class Text {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  get length() {
    return this.value.length;
  }

  get getTotalLines(): number {
    return 0;
  }

  getViewportText(viewport: Viewport): string[] {
    return [""];
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
