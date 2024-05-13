import Viewport from "./Viewport";
import Cursor, { IAbsCoordinates, IRelativeCoordinates } from "./Cursor";
import { Modes } from "./constants";

export interface Tag {
  position: number;
  tag: string;
}

class Segment {
  lineStart: number = -1; // incl.
  lineEnd: number = -1; // incl.
  raw: string;
  parsed: string = "";
  openingTags: Tag[] = [];
  closingTags: Tag[] = [];
  lines: string[] = [];

  constructor(text: string) {
    this.raw = text;
    this.parseText();
  }

  parseText() {
    this.openingTags = [];
    this.closingTags = [];
    const openingTagsRegex = /<([^<>\/]+?)>/g;
    const closingTagsRegex = /<\/([^<>]+?)>/g;

    // Find opening tags
    let match;
    while ((match = openingTagsRegex.exec(this.raw)) !== null) {
      this.openingTags.push({
        position: match.index,
        tag: match[1],
      });
    }

    // Find closing tags
    while ((match = closingTagsRegex.exec(this.raw)) !== null) {
      this.closingTags.push({
        position: match.index,
        tag: match[1],
      });
    }

    // Remove tags from the text
    this.parsed = this.raw.replace(/<\/?[^<>]+?>/g, "");
  }

  getTagsForPosition(pos: SegmentPosition): [Tag[], Tag[]] {
    const openedTags: Tag[] = [];
    const closedTags: Tag[] = [];
    for (const tag of this.openingTags) {
      if (tag.position < pos.rawTextIndex) {
        openedTags.push(tag);
      }
    }
    for (const tag of this.closingTags) {
      if (tag.position < pos.rawTextIndex) {
        closedTags.push(tag);
      }
    }
    return [openedTags, closedTags];
  }

  findTagParsedPosition(tag: Tag): { x: number, y: number } {
    // find abs position right after the <tag>
    let parsedTextOpenPosition = this.openingTags
      .filter((t) => t.position < tag.position)
      .reduce((acc, cur) => {
        return acc - cur.tag.length - 2;
      }, tag.position);
    parsedTextOpenPosition = this.closingTags
      .filter((t) => t.position < tag.position)
      .reduce((acc, cur) => {
        return acc - cur.tag.length - 3;
      }, parsedTextOpenPosition);

    let y = this.lineStart;
    let x = parsedTextOpenPosition;
    for (const line of this.lines) {
      if (x - line.length <= 0) {
        break;
      }
      x -= line.length + 1;
      y++;
    }

    return { x, y };
  }
}

export interface SegmentPosition {
  segmentIndex: number;
  lineIndex: number;
  charInLineIndex: number;
  parsedTextIndex: number;
  rawTextIndex: number;
}

/**
 * Text provides more abstract control over the provided raw text
 */
class Text {
  mode: Modes = Modes.RAW;
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
      segments.push(new Segment(segmentText));
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
      const segment = this.segments[segmentIndex];

      /* if (
        this.dirtySegment !== undefined &&
        parseInt(segmentIndex) < this.dirtySegment
      ) {
        currentLineNumber += segment.lines.length;
        continue;
      }
*/
      segment.lineStart = currentLineNumber;
      segment.lines = [];

      let text = segment.raw;
      if (this.mode === Modes.HIGHLIGHT || this.mode === Modes.SEMI) {
        text = segment.parsed;
      }
      const words = text.split(" ");
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
    const pos = this.getSegmentPosition(
      cursor.yLine + viewport.lineStart,
      cursor.xLine
    );
    return pos;
  }

  getSegmentPosition(
    absLineIndex: number,
    charInLineIndex: number = 0
  ): SegmentPosition | null {
    const segmentIndex = this.segments.findIndex(
      (s) => s.lineStart <= absLineIndex && s.lineEnd > absLineIndex
    );
    if (segmentIndex === -1) {
      return null;
    }

    const segment = this.segments[segmentIndex];
    const lineIndex = absLineIndex - segment.lineStart;
    charInLineIndex = Math.min(
      charInLineIndex,
      segment.lines[lineIndex].length
    );
    let parsedTextIndex = charInLineIndex;
    for (let i = 0; i < lineIndex; i++) {
      parsedTextIndex += segment.lines[i].length + 1;
    }

    let rawTextIndex = parsedTextIndex;

    if (this.mode !== Modes.RAW) {
      for (const tag of segment.openingTags) {
        if (tag.position <= rawTextIndex) {
          rawTextIndex += tag.tag.length + 2;
        }
      }
      for (const tag of segment.closingTags) {
        if (tag.position <= rawTextIndex) {
          rawTextIndex += tag.tag.length + 3;
        }
      }
    }

    return {
      segmentIndex,
      lineIndex,
      charInLineIndex,
      parsedTextIndex,
      rawTextIndex,
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
      parsedTextIndex: 0,
      rawTextIndex: 0,
    };
  }

  /**
   * getViewportText returns visible text to be rendered by Viewport
   * @param viewport
   * @returns
   */
  getViewportText(viewport: Viewport): string[] {
    const posStart = this.getSegmentPosition(viewport.lineStart);
    const posEnd =
      this.getSegmentPosition(viewport.lineEnd) ||
      this.getLastSegmentPosition();

    if (!posStart || !posEnd) {
      return [];
    }

    const out: string[] = [];
    for (let i = posStart.segmentIndex; i <= posEnd.segmentIndex; i++) {
      if (i === posStart.segmentIndex) {
        out.push(...this.segments[i].lines.slice(posStart.lineIndex));
      } else if (i === posEnd.segmentIndex) {
        out.push(...this.segments[i].lines.slice(0, posEnd.lineIndex + 1));
      } else {
        out.push(...this.segments[i].lines);
      }
    }
    return out;
  }

  findWordOffsets(text: string, index: number): [number, number] {
    const wordRegex = /[^\s,.]+/g; // Match any sequence of characters that are not whitespace, comma, or dot
    let match;

    // Find all matches of words in the text
    const matches = [];
    while ((match = wordRegex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }

    // Find the word containing the given index
    let wordIndices;
    for (let i = 0; i < matches.length; i++) {
      const { start, end } = matches[i];
      if (index >= start && index < end) {
        wordIndices = { start, end };
        break;
      }
    }

    // If no word contains the given index, return default offsets
    if (!wordIndices) {
      return [0, 0];
    }

    // Calculate offsets relative to the word's start and end indices
    const startOffset = index - wordIndices.start;
    const endOffset = wordIndices.end - index;

    return [-startOffset, endOffset];
  }

  /**
   * getCursorWord returns current word under active cursor
   * @param cursor
   * @returns
   */
  getCursorWordOffsets(viewport: Viewport, cursor: Cursor): [number, number] {
    const position = this.cursorToIndex(viewport, cursor);
    if (!position) {
      return [0, 0];
    }

    let text = this.segments[position.segmentIndex].parsed;
    let textIndex = position.parsedTextIndex;

    if (this.mode === Modes.RAW) {
      text = this.segments[position.segmentIndex].raw;
      textIndex = position.rawTextIndex;
    }

    return this.findWordOffsets(text, textIndex);
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
    if (!segmentPosition) {
      return;
    }

    let indexPosition = segmentPosition.rawTextIndex;
    const segment = this.segments[segmentPosition.segmentIndex];

    if (this.mode !== Modes.RAW) {
      for (const tag of segment.closingTags) {
        if (tag.position < segmentPosition.rawTextIndex) {
          indexPosition -= tag.tag.length + 3
        }
      }
    }

    for (let i = 0; i < segmentPosition.segmentIndex; i++) {
      indexPosition++; // each segment should receive +1 character no matter what (newline)
      indexPosition += this.segments[i].raw.length;
    }

    this.value =
      this.value.slice(0, indexPosition) +
      textToInsert +
      this.value.slice(indexPosition);


    segment.raw =
      segment.raw.slice(0, segmentPosition.rawTextIndex) +
      textToInsert +
      segment.raw.slice(segmentPosition.rawTextIndex);

    segment.parseText();   
    this.calculateLines();
  }

  /**
   * adds newline character on current cursor position, creating new segment in the process
   * @param viewport
   * @param cursorPosition
   * @returns
   */
  insertNewline(viewport: Viewport, cursorPosition: Cursor): void {
    const segmentPosition = this.cursorToIndex(viewport, cursorPosition);
    if (!segmentPosition) {
      return;
    }

    let indexPosition = segmentPosition.rawTextIndex;
    for (let i = 0; i < segmentPosition.segmentIndex; i++) {
      indexPosition++; // each segment should receive +1 character no matter what (newline)
      indexPosition += this.segments[i].raw.length;
    }

    this.value =
      this.value.slice(0, indexPosition) +
      "\n" +
      this.value.slice(indexPosition);

    this.prepareSegments();
    this.calculateLines();
  }

  deleteSegment(index: number) {
    this.segments = this.segments
      .slice(0, index)
      .concat(this.segments.slice(index + 1));
  }

  /**
   * deleteText removes specific number of charactes from cursor position
   * @param viewport
   * @param cursorPosition
   * @param charsToDelete
   */
  deleteText(
    viewport: Viewport,
    cursorPosition: Cursor,
    charsToDelete: number
  ): void {
    const segmentPos = this.cursorToIndex(viewport, cursorPosition);
    if (!segmentPos) {
      return;
    }

    this.dirtySegment = segmentPos.segmentIndex;

    let indexPos = segmentPos.rawTextIndex;
    for (let i = 0; i < segmentPos.segmentIndex; i++) {
      indexPos++; // each segment should receive +1 character no matter what (newline)
      indexPos += this.segments[i].raw.length;
    }

    this.value = this.value.slice(0, indexPos - 1) + this.value.slice(indexPos);

    const segment = this.segments[segmentPos.segmentIndex];

    if (!segment.raw) {
      this.prepareSegments();
    } else if (segmentPos.rawTextIndex) {
      const xAlterPos =
        segmentPos.rawTextIndex - (charsToDelete > 0 ? 1 : 0);
      segment.raw =
        segment.raw.slice(0, xAlterPos) + segment.raw.slice(xAlterPos + 1);
      segment.parseText();
    } else {
      this.prepareSegments();
    }

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

  getTagPosition(viewport: Viewport, tag: string): IRelativeCoordinates[] {
    let openingTag: Tag = { position: -1, tag: "" };
    let openingSegment: Segment | undefined = undefined;
    let closingTag: Tag = { position: -1, tag: "" };
    let closingSegment: Segment | undefined = undefined;

    for (const segment of this.segments) {
      const foundOpeningTag = segment.openingTags.find((t) => t.tag === tag);
      if (foundOpeningTag) {
        openingTag = foundOpeningTag;
        openingSegment = segment;
        break;
      }
    }

    for (const segment of this.segments) {
      const foundClosingTag = segment.closingTags.find((t) => t.tag === tag);
      if (foundClosingTag) {
        closingTag = foundClosingTag;
        closingSegment = segment;
        break;
      }
    }

    if (!openingTag || !closingTag || !openingSegment || !closingSegment) {
      return [];
      // throw new Error("opening or closing tag not found..")
    }

    const start = openingSegment.findTagParsedPosition(openingTag)
    const end = closingSegment.findTagParsedPosition(closingTag)
    return [
      {
        xLine: start.x,
        yLine: start.y,
      },
      {
        xLine: end.x,
        yLine: end.y,
      },
    ];
  }
}

export default Text;
