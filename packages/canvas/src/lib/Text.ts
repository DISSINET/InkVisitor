import Viewport from "./Viewport";
import Cursor, { IAbsCoordinates } from "./Cursor";

interface Segment {
  lineStart: number; // incl.
  lineEnd: number; // incl.
  text: string;
  lines: string[];
}

interface SegmentPosition {
  segmentIndex: number;
  lineIndex: number;
  charInLineIndex: number;
  textCharIndex: number; 
}

/**
 * Text provides more abstract control over the provided raw text
 */
class Text {
  segments: Segment[];
  dirtySegment?: number;
  value: string;
  charsAtLine: number;
  
  constructor(value: string, charsAtLine: number) {
    this.value = value;
    this.segments = [];
    this.prepareSegments();
    this.charsAtLine = charsAtLine;
    this.calculateLines();
  }

  get noLines(): number {
    return this.segments.reduce<number>((a, c) => a + c.lines.length, 0);
  }

  get lines(): string[] {
    return this.segments.reduce<string[]>((a, cur) => a.concat(cur.lines), []);
  }

  prepareSegments() {
    const segmentsArray = this.value.split("\n");
    const segments: Segment[] = [];

    for (let i = 0; i < segmentsArray.length; i++) {
      const segmentText = segmentsArray[i];
      segments.push({
        text: segmentText,
        lineEnd: -1,
        lineStart: -1,
        lines: [],
      });
    }

    this.segments = segments;
  }

  /**
   * calculateLines processes the raw text by splitting it into lines
   * TODO provide more optimized approach so this method does not have to recalculate everyting after writing single characted
   */
  calculateLines(): void {
    const time1 = performance.now();
    let currentLineNumber: number = 0;
    for (const segmentIndex in this.segments) {
      const segment= this.segments[segmentIndex]
      
      if (this.dirtySegment !== undefined && parseInt(segmentIndex) < this.dirtySegment) {
        currentLineNumber += segment.lines.length
        continue;
      }

      segment.lineStart = currentLineNumber;
      segment.lines = [];

      const words = segment.text.split(" ");
      let currentLine: string[] = [];
      let currentLineLength = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordLength = word.length;
        if (currentLineLength + wordLength > this.charsAtLine) {
          // Join the current line into a string and push it to lines
          segment.lines.push(currentLine.join(" "));
          currentLineNumber++;

          currentLine = [word]; // Start a new line with the current word
          currentLineLength = wordLength + 1; // Reset the length (+1 for the space)
        } else {
          currentLine.push(word);
          currentLineLength += wordLength + 1; // +1 for the space
        }

        if (i + 1 === words.length) {
          // Add the last line if it's not empty
          if (currentLine.length > 0) {
            segment.lines.push(currentLine.join(" "));
            currentLineNumber++;
          }
        }
      }

      segment.lineEnd = currentLineNumber;
    }

    const time2 = performance.now();
    console.log(`${time2 - time1} ms `);
  }

  /**
   * cursorToIndex calculates index position of the text from cursor position
   * @param viewport
   * @param cursor
   * @returns
   */
  cursorToIndex(viewport: Viewport, cursor: Cursor): SegmentPosition | null {
    const pos = this.getSegmentPosition(cursor.yLine + viewport.lineStart, cursor.xLine);
    return pos;
  }

  getSegmentPosition(absLineIndex: number, charIndex: number = 0): SegmentPosition | null {
    const segmentIndex = this.segments.findIndex(
      (s) => s.lineStart <= absLineIndex && s.lineEnd > absLineIndex
    );
    if (segmentIndex === -1) {
      return null;
    }

    let textCharIndex = charIndex
    const lineIndex = absLineIndex - this.segments[segmentIndex].lineStart;
    for (let i = 0; i < lineIndex; i++) {
      textCharIndex += this.segments[segmentIndex].lines[i].length + 1;
    }

    return {
      segmentIndex,
      lineIndex,
      charInLineIndex: charIndex,
      textCharIndex,
    };
  }

  getLastSegmentPosition(): SegmentPosition | null {
    if (this.segments.length === 0) {
      return null;
    }

    const lastSegment = this.segments[this.segments.length - 1];
    return {
      segmentIndex: this.segments.length - 1,
      lineIndex: lastSegment.lines.length - 1,
      charInLineIndex: 0,
      textCharIndex: 0,
    };
  }

  /**
   * getViewportText returns visible text to be rendered by Viewport
   * @param viewport
   * @returns
   */
  getViewportText(viewport: Viewport): string[] {
    const posStart = this.getSegmentPosition(viewport.lineStart);
    const posEnd = this.getSegmentPosition(viewport.lineEnd) || this.getLastSegmentPosition();

    if (!posStart || !posEnd) {
      return [];
    }

    const out: string[] = [];
    for (let i = posStart.segmentIndex; i <= posEnd.segmentIndex; i++) {
      if (i === posStart.segmentIndex) {
        out.push(...this.segments[i].lines.slice(posStart.lineIndex))        
      } else if (i === posEnd.segmentIndex) {
        out.push(...this.segments[i].lines.slice(0, posEnd.lineIndex + 1))              
      } else {
        out.push(...this.segments[i].lines)
      }
    }


    return out;
  }

  /**
   * getCursorWord returns current word under active cursor
   * @param cursor
   * @returns
   */
  getCursorWord(cursor?: Cursor): string {
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
    const segmentPosition = this.cursorToIndex(viewport, cursorPosition);
    if(!segmentPosition) {
      return
    }

    const segment = this.segments[segmentPosition.segmentIndex]
    segment.text = segment.text.slice(0, segmentPosition.textCharIndex) + textToInsert + segment.text.slice(segmentPosition.textCharIndex );
    this.calculateLines();
  }

  insertNewline(
    viewport: Viewport,
    cursorPosition: Cursor,
    textToInsert: string
  ): void {
    const segmentPosition = this.cursorToIndex(viewport, cursorPosition);
    if(!segmentPosition) {
      return
    }

    let indexPosition = segmentPosition.textCharIndex;
    for (let i = 0; i < segmentPosition.segmentIndex; i++) {
      indexPosition += this.segments[i].lines.reduce((acc, cur) => {
        return acc + cur.length;
      }, 1) // 1 because of newline 
    }

    this.value = this.value.slice(0, indexPosition)
    + '\n' + this.value.slice(indexPosition);

    this.prepareSegments();
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
    const segmentPosition = this.cursorToIndex(viewport, cursorPosition);
    if(!segmentPosition) {
      return
    }
    
    this.dirtySegment = segmentPosition.segmentIndex;

    const xAlterPos = segmentPosition.textCharIndex - ( chartsToDelete > 0 ? 1 : 0)
    const segment = this.segments[segmentPosition.segmentIndex]
    segment.text = segment.text.slice(0, xAlterPos) + segment.text.slice(xAlterPos + 1);

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
    if (!linesSize) {
      return "";
    }

    rangeLines[linesSize - 1] = rangeLines[linesSize - 1].slice(0, end.xLine);
    rangeLines[0] = rangeLines[0].slice(start.xLine, rangeLines[0].length + 1);
    return rangeLines.join("\n");
  }
}

export default Text;
