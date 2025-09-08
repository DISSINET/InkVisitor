import Viewport from "./Viewport";
import { IAbsCoordinates, IRelativeCoordinates } from "./Highlighter";
import { EditMode } from "./constants";

export class Tag {
  position: number;
  tag: string;
  closing?: boolean;
  attributes: Record<string, string>;
  relativeParsedPosition: number;

  constructor(position: number, tag: string, closing?: boolean, segment?: Segment) {
    this.position = position;
    this.tag = tag;
    this.closing = closing;
    this.attributes = this.parseAttributes(tag);
    this.relativeParsedPosition = this.calculateRelativeParsedPosition(segment);
  }

  private parseAttributes(tagString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    // Split the tag string to separate tag name from attributes
    const parts = tagString.trim().split(/\s+/);
    
    // If there are no attributes, return empty object
    if (parts.length === 1) {
      return attributes;
    }
    
    // Parse attributes from the remaining parts
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const equalIndex = part.indexOf('=');
      
      if (equalIndex > 0) {
        const key = part.substring(0, equalIndex);
        let value = part.substring(equalIndex + 1);
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        attributes[key] = value;
      }
    }
    
    return attributes;
  }

  private calculateRelativeParsedPosition(segment?: Segment): number {
    if (!segment) {
      return 0;
    }

    // Calculate the parsed position by subtracting the length of all tags that come before this tag
    let parsedPosition = this.position;
    
    // Subtract length of all opening tags before this position
    for (const tag of segment.openingTags) {
      if (tag.position < this.position) {
        parsedPosition -= tag.tag.length + 2; // +2 for < and >
      }
    }
    
    // Subtract length of all closing tags before this position
    for (const tag of segment.closingTags) {
      if (tag.position < this.position) {
        parsedPosition -= tag.tag.length + 3; // +3 for </ and >
      }
    }
    
    return parsedPosition;
  }

  getTag(): string {
    if (this.closing) {
      return `</${this.tag}>`;
    }
    let openTag = `<${this.tag}`;
    for (const [key, value] of Object.entries(this.attributes)) {
      openTag += ` ${key}="${value}"`;
    }
    openTag += '>';
    return openTag;
  }
}

export class Segment {
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
      this.openingTags.push(new Tag(match.index, match[1], false, this));
    }

    // Find closing tags
    while ((match = closingTagsRegex.exec(this.raw)) !== null) {
      this.closingTags.push(new Tag(match.index, match[1], true, this));
    }

    // Remove tags from the text
    this.parsed = this.raw.replace(/<\/?[^<>]+?>/g, "");
  }

  /**
   * Returns list of opening/closing tags in this segment before raw index
   * @param rawIndex
   * @returns
   */
  getTagsBeforePosition(rawIndex: number): [Tag[], Tag[]] {
    const openedTags: Tag[] = [];
    const closedTags: Tag[] = [];
    for (const tag of this.openingTags) {
      if (tag.position < rawIndex) {
        openedTags.push(tag);
      }
    }
    for (const tag of this.closingTags) {
      if (tag.position < rawIndex) {
        closedTags.push(tag);
      }
    }
    return [openedTags, closedTags];
  }

  /**
   * Returns list of opening/closing tags in this segment after raw index
   * @param rawIndex
   * @returns
   */
  getTagsAfterPosition(rawIndex: number): [Tag[], Tag[]] {
    const openedTags: Tag[] = [];
    const closedTags: Tag[] = [];
    for (const tag of this.openingTags) {
      if (tag.position > rawIndex) {
        openedTags.push(tag);
      }
    }
    for (const tag of this.closingTags) {
      if (tag.position > rawIndex) {
        closedTags.push(tag);
      }
    }
    return [openedTags, closedTags];
  }

  /**
   * Returns list of opening/closing tags in this segment between start/end raw indexes
   * @param pos
   * @returns
   */
  getTagsInPosition(
    startRawIndex: number,
    endRawIndex: number
  ): [Tag[], Tag[]] {
    const openedTags: Tag[] = [];
    const closedTags: Tag[] = [];
    for (const tag of this.openingTags) {
      if (tag.position < endRawIndex && tag.position > startRawIndex) {
        openedTags.push(tag);
      }
    }
    for (const tag of this.closingTags) {
      if (tag.position < endRawIndex && tag.position > startRawIndex) {
        closedTags.push(tag);
      }
    }
    return [openedTags, closedTags];
  }

  findTagParsedPosition(tag: Tag): { x: number; y: number } {
    // find abs position right after the <tag> in segment's text
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

    // fold text-lines to get line-based positon (2d instead of 1d coordinates)
    let y = this.lineStart;
    let x = parsedTextOpenPosition;
    for (const line of this.lines) {
      if (x - line.length <= 0) {
        break;
      }
      x -= line.length;
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
  mode: EditMode = EditMode.RAW;
  segments: Segment[];
  dirtySegment?: number;
  value: string;
  charsAtLine: number;
  noLines: number;
  constructor(value: string, charsAtLine: number) {
    this.value = value;
    this.segments = [];
    this.prepareSegments();
    this.charsAtLine = charsAtLine;
    this.noLines = 0;
    this.calculateLines();
  }

  /**
   * Returns the line at the specified index by iterating over segments
   * @param lineIndex The absolute line index
   * @returns The line at the specified index or an empty string if not found
   */
  getLine(lineIndex: number): string {
    // Find the segment that contains the line
    const segmentIndex = this.segments.findIndex(
      (s) => s.lineStart <= lineIndex && s.lineEnd > lineIndex
    );

    if (segmentIndex === -1) {
      return "";
    }

    // Calculate the relative line index within the segment
    const segment = this.segments[segmentIndex];
    const relativeLineIndex = lineIndex - segment.lineStart;

    // Return the line from the segment
    return segment.lines[relativeLineIndex] || "";
  }

  updateCharsAtLine(charsAtLine: number) {
    this.charsAtLine = charsAtLine;
    this.calculateLines();
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

  assignValueFromSegments(): void {
    this.value = this.segments.map((s) => s.raw).join("\n");
    this.calculateLines();
  }

  /**
   * calculateLines processes the raw text by splitting it into lines
   * TODO provide more optimized approach so this method does not have to recalculate everyting after writing single characted
   */
  calculateLines(): void {
    const time1 = performance.now();
    for (
      let segmentIndex = 0;
      segmentIndex < this.segments.length;
      segmentIndex++
    ) {
      const segment = this.segments[segmentIndex];

      /* if (
        this.dirtySegment !== undefined &&
        parseInt(segmentIndex) < this.dirtySegment
      ) {
        currentLineNumber += segment.lines.length;
        continue;
      }
*/
      segment.lineStart =
        segmentIndex === 0 ? 0 : this.segments[segmentIndex - 1].lineEnd;
      segment.lines = [];

      let text = segment.raw;
      if (this.mode === EditMode.HIGHLIGHT || this.mode === EditMode.SEMI) {
        text = segment.parsed;
      }

      const regex: RegExp = /(<[^>]+>)|([\w']+)/g;
      const tokens = text.split(regex).filter((t) => !!t);
      let currentLine: string[] = [];
      let currentLineLength = 0;
      for (let iToken = 0; iToken < tokens.length; iToken++) {
        const token = tokens[iToken];
        const tokenLength = token.length;
        if (currentLineLength + tokenLength > this.charsAtLine) {
          // Join the current line into a string and push it to lines
          segment.lines.push(currentLine.join(""));
          currentLine = [token]; // Start a new line with the current word
          currentLineLength = tokenLength; // Reset the length (+1 for the space)
        } else {
          currentLine.push(token);
          currentLineLength += tokenLength; // +1 for the space
        }

        if (iToken + 1 === tokens.length) {
          // Add the last line if it's not empty
          if (currentLine.length > 0) {
            segment.lines.push(currentLine.join(""));
          }
        }
      }
      segment.lineEnd = segment.lineStart + (segment.lines.length || 1);

      if (!segment.lines.length) {
        segment.lines = [""];
      }
    }

    // Performance check
    // const time2 = performance.now();
    // console.log(`${time2 - time1} ms `);
    this.noLines = this.segments.reduce<number>(
      (a, c) => a + c.lines.length,
      0
    );
  }

  /**
   * cursorToIndex calculates index position of the text from cursor position
   * @param viewport
   * @param cursor
   * @returns
   */
  cursorToIndex(
    viewport: Viewport,
    cursor: IRelativeCoordinates
  ): SegmentPosition | null {
    const pos = this.getSegmentPosition(
      cursor.yLine + viewport.lineStart,
      cursor.xLine
    );

    return pos;
  }

  getCurrentLine(
    viewport: Viewport,
    cursor: IRelativeCoordinates
  ): string | null {
    const segment = this.cursorToIndex(viewport, cursor);
    if (!segment) {
      return null;
    }

    return this.segments[segment.segmentIndex].lines[segment.lineIndex];
  }

  /**
   * getAbsTextIndex returns absolute text index from absolute coordinates
   * @param absCoords
   * @returns
   */
  getAbsTextIndex(absCoords: IAbsCoordinates): number {
    const pos = this.getSegmentPosition(absCoords.yLine, absCoords.xLine);
    if (!pos) {
      return -1;
    }

    return this.getAbsTextIndexFromPosition(pos);
  }

  /**
   * getAbsTextIndexFromPosition returns absolute text index from segment position
   * @param segment
   * @returns
   */
  getAbsTextIndexFromPosition(segment: SegmentPosition | null): number {
    if (!segment) {
      return -1;
    }
    let absIndex = segment.rawTextIndex;
    for (let i = 0; i < segment.segmentIndex; i++) {
      absIndex += this.segments[i].raw.length + 1;
    }
    return absIndex;
  }

  /**
   * getSegmentFromAbsTextIndex returns segment position from absolute text index
   * @param absTextIndex
   * @returns
   */
  getSegmentFromAbsTextIndex(absTextIndex: number): SegmentPosition | null {
    if (absTextIndex < 0 || this.segments.length === 0) {
      return null;
    }

    let currentIndex = 0;

    // Find which segment contains this absolute text index
    for (
      let segmentIndex = 0;
      segmentIndex < this.segments.length;
      segmentIndex++
    ) {
      const segment = this.segments[segmentIndex];
      const segmentLength = segment.raw.length;

      // Check if the index falls within this segment
      if (absTextIndex < currentIndex + segmentLength) {
        const rawTextIndex = absTextIndex - currentIndex;

        // Calculate parsed text index by accounting for tags
        let parsedTextIndex = rawTextIndex;
        if (this.mode !== EditMode.RAW) {
          const tags = segment.openingTags
            .concat(segment.closingTags)
            .sort((a, b) => a.position - b.position);

          for (const tag of tags) {
            if (tag.position <= rawTextIndex) {
              parsedTextIndex -= tag.tag.length + (tag.closing ? 3 : 2);
            }
          }
        }

        // Find line index and character position within the line
        let lineIndex = 0;
        let charInLineIndex = parsedTextIndex;
        let remainingChars = parsedTextIndex;

        for (let i = 0; i < segment.lines.length; i++) {
          const lineLength = segment.lines[i].length;
          if (remainingChars < lineLength) {
            lineIndex = i;
            charInLineIndex = remainingChars;
            break;
          }
          remainingChars -= lineLength;
          lineIndex = i + 1;
        }

        // Ensure we don't exceed bounds
        if (lineIndex >= segment.lines.length) {
          lineIndex = segment.lines.length - 1;
          charInLineIndex = segment.lines[lineIndex]?.length || 0;
        }

        return {
          segmentIndex,
          lineIndex,
          charInLineIndex,
          parsedTextIndex: Math.max(0, parsedTextIndex),
          rawTextIndex,
        };
      }

      // Move to next segment (add 1 for newline character between segments)
      currentIndex += segmentLength + 1;

      // Handle case where index points to the newline between segments
      if (
        absTextIndex === currentIndex - 1 &&
        segmentIndex < this.segments.length - 1
      ) {
        // Return end of current segment
        const lastLineIndex = segment.lines.length - 1;
        const lastLineLength = segment.lines[lastLineIndex]?.length || 0;

        return {
          segmentIndex,
          lineIndex: lastLineIndex,
          charInLineIndex: lastLineLength,
          parsedTextIndex: segment.parsed.length,
          rawTextIndex: segment.raw.length,
        };
      }
    }

    // If index is beyond the text, return the last position
    if (absTextIndex >= currentIndex - 1) {
      const lastSegmentIndex = this.segments.length - 1;
      const lastSegment = this.segments[lastSegmentIndex];
      const lastLineIndex = lastSegment.lines.length - 1;
      const lastLineLength = lastSegment.lines[lastLineIndex]?.length || 0;

      return {
        segmentIndex: lastSegmentIndex,
        lineIndex: lastLineIndex,
        charInLineIndex: lastLineLength,
        parsedTextIndex: lastSegment.parsed.length,
        rawTextIndex: lastSegment.raw.length,
      };
    }

    return null;
  }

  /**
   * getLineFromPosition returns line from segment position
   * @param segment
   * @returns
   */
  getLineFromPosition(segment: SegmentPosition): string {
    return this.segments[segment.segmentIndex].lines[segment.lineIndex] || "";
  }

  /**
   * getSegmentPosition returns segment position from absolute line index
   * @param absLineIndex
   * @param charInLineIndex
   * @returns
   */
  getSegmentPosition(
    absLineIndex: number,
    charInLineIndex: number = 0,
    ignoreLastClosingTag: boolean = false
  ): SegmentPosition | null {
    // sanitize bounds
    if (absLineIndex < 0) {
      absLineIndex = 0;
    } else if (absLineIndex > this.noLines) {
      absLineIndex = this.noLines;
    }

    const segmentIndex = this.segments.findLastIndex(
      (s) => s.lineStart <= absLineIndex && s.lineEnd >= absLineIndex
    );

    if (segmentIndex === -1) {
      return null;
    }

    const segment = this.segments[segmentIndex];
    const lineIndex = absLineIndex - segment.lineStart;

    // compute initial start - jumping over previous segments / previous lines in current segment
    charInLineIndex = segment.lines[lineIndex]
      ? Math.min(charInLineIndex, segment.lines[lineIndex].length)
      : 0;
    let parsedTextIndex = charInLineIndex;
    for (let i = 0; i < lineIndex; i++) {
      parsedTextIndex += segment.lines[i].length;
    }

    let rawTextIndex = parsedTextIndex;

    // dont include opening and closing tags <tag> + </tag> if not raw mode
    if (this.mode !== EditMode.RAW) {
      const tags = segment.openingTags
        .concat(segment.closingTags)
        .sort((a, b) => a.position - b.position);
      for (const tag of tags) {
        // condition which ignores tags on same position as current rawTextIndex
        if (
          ignoreLastClosingTag
            ? tag.position < rawTextIndex
            : tag.position <= rawTextIndex
        ) {
          rawTextIndex += tag.tag.length + (tag.closing ? 3 : 2);
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

  /**
   * getLastSegmentPosition returns last segment position
   * @returns
   */
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
   * Returns an array of lines between the specified start and end line indices
   * @param startLine The starting line index (inclusive)
   * @param endLine The ending line index (exclusive)
   * @returns Array of lines between the specified indices
   */
  getRangeLines(startLine: number, endLine: number): string[] {
    // Sanitize bounds
    if (startLine < 0) startLine = 0;
    if (endLine > this.noLines) endLine = this.noLines;
    if (startLine >= endLine) return [];

    const result: string[] = [];

    // Find the segments that contain the requested lines
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];

      // Skip segments that don't contain any of the requested lines
      if (segment.lineEnd <= startLine || segment.lineStart >= endLine) {
        continue;
      }

      // Calculate the relative line indices within this segment
      const relativeStartLine = Math.max(0, startLine - segment.lineStart);
      const relativeEndLine = Math.min(
        segment.lines.length,
        endLine - segment.lineStart
      );

      // Add the relevant lines from this segment
      result.push(...segment.lines.slice(relativeStartLine, relativeEndLine));
    }

    return result;
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
      if (this.segments[i].lines.length) {
        if (i === posStart.segmentIndex) {
          out.push(...this.segments[i].lines.slice(posStart.lineIndex));
        } else if (i === posEnd.segmentIndex) {
          out.push(...this.segments[i].lines.slice(0, posEnd.lineIndex + 1));
        } else if (this.segments[i].lines.length > 0) {
          out.push(...this.segments[i].lines);
        } else {
          console.warn("Should not happen");
        }
      }
    }
    return out;
  }

  /**
   * findWordOffsets returns word offsets from text and index
   * @param text
   * @param index
   * @returns
   */
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
  getCursorWordOffsets(
    viewport: Viewport,
    cursor: IRelativeCoordinates
  ): [number, number] {
    const position = this.cursorToIndex(viewport, cursor);
    if (!position) {
      return [0, 0];
    }

    let text = this.segments[position.segmentIndex].parsed;
    let textIndex = position.parsedTextIndex;

    if (this.mode === EditMode.RAW) {
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
    cursorPosition: IRelativeCoordinates,
    textToInsert: string
  ): void {
    const segmentPosition = this.cursorToIndex(viewport, cursorPosition);
    if (!segmentPosition) {
      return;
    }

    let indexPosition = segmentPosition.rawTextIndex;
    const segment = this.segments[segmentPosition.segmentIndex];

    if (this.mode !== EditMode.RAW) {
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
  insertNewline(
    viewport: Viewport,
    cursorPosition: IRelativeCoordinates
  ): void {
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
   * deleteText removes one char from text at cursor's position
   * For more characters, see deleteRangeText as that method is slighly slower that this
   * @param viewport
   * @param cursorPosition
   * @param forwardChar
   */
  deleteTextChar(
    viewport: Viewport,
    cursorPosition: IRelativeCoordinates,
    forwardChar?: boolean
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
      const xAlterPos = segmentPos.rawTextIndex - (forwardChar ? 0 : 1);
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

    const rangeLines = this.getRangeLines(start.yLine, end.yLine + 1);
    const linesSize = rangeLines.length;
    if (!linesSize) {
      return "";
    }

    rangeLines[linesSize - 1] = rangeLines[linesSize - 1].slice(0, end.xLine);
    rangeLines[0] = rangeLines[0].slice(start.xLine, rangeLines[0].length + 1);
    return rangeLines.join("\n");
  }

  deleteRangeText(start: IAbsCoordinates, end: IAbsCoordinates): void {
    // swap in case start is after end
    if (
      start.yLine > end.yLine ||
      (start.yLine === end.yLine && start.xLine > end.xLine)
    ) {
      const tempStart = start;
      start = end;
      end = tempStart;
    }

    const startI = this.getAbsTextIndex(start);
    const endI = this.getAbsTextIndex(end);
    this.value = this.value.substring(0, startI) + this.value.substring(endI);

    this.prepareSegments();
    this.calculateLines();
  }

  getTagPosition(tag: string, index: number = 0): IAbsCoordinates[] {
    let openingTagMatch: { tag: Tag; segment: Segment } | null = null;
    let closingTagMatch: { tag: Tag; segment: Segment } | null = null;

    let openingTagIndex = 0;
    let closingTagIndex = 0;

    // Search for the opening tag
    for (const segment of this.segments) {
      for (const openingTag of segment.openingTags) {
        if (openingTag.tag === tag) {
          if (openingTagIndex === index) {
            openingTagMatch = { tag: openingTag, segment };
            break;
          }
          openingTagIndex++;
        }
      }
      if (openingTagMatch) break;
    }

    // Search for the closing tag
    for (const segment of this.segments) {
      for (const closingTag of segment.closingTags) {
        if (closingTag.tag === tag) {
          if (closingTagIndex === index) {
            closingTagMatch = { tag: closingTag, segment };
            break;
          }
          closingTagIndex++;
        }
      }
      if (closingTagMatch) break;
    }

    // Check if both tags were found
    if (!openingTagMatch || !closingTagMatch) {
      // console.warn(`Tag "${tag}" with occurrence ${occurrence} not found.`);
      return [];
    }

    // Calculate the parsed positions of the opening and closing tags
    const start = openingTagMatch.segment.findTagParsedPosition(
      openingTagMatch.tag
    );
    const end = closingTagMatch.segment.findTagParsedPosition(
      closingTagMatch.tag
    );

    // Return the coordinates
    return [
      { xLine: start.x, yLine: start.y },
      { xLine: end.x, yLine: end.y },
    ];
  }
}

export default Text;
