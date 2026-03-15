import Viewport from "./Viewport";
import { IAbsCoordinates, IRelativeCoordinates } from "./Highlighter";
import { EditMode } from "./constants";
import {
  closingTagRegex,
  createOpeningTagRegex,
  tagRemovalRegex,
} from "./Annotator";

/**
 * Represents an XML-like tag within a text segment.
 * Tags can be opening or closing tags and may contain attributes.
 */
export class Tag {
  readonly position: number; // raw position in segment text
  readonly relativeParsedPosition: number; // relative position in parsed segment text
  readonly closing?: boolean;
  readonly segmentIndex: number; // index of the segment containing this tag

  private tagContent: string; // div id="12"
  attributes: Record<string, string>;

  /**
   * Creates a new Tag instance.
   *
   * @param position - The absolute position of the tag in the raw text
   * @param tag - The tag name (e.g., "person", "location" along with attributes)
   * @param closing - Whether this is a closing tag (default: false)
   * @param segment - Optional segment reference for calculating relative position
   * @param segmentIndex - The index of the segment containing this tag
   */
  constructor(
    position: number,
    tag: string,
    closing?: boolean,
    segment?: Segment,
    segmentIndex?: number
  ) {
    this.position = position;
    this.tagContent = tag;
    this.closing = closing;
    this.segmentIndex = segmentIndex ?? -1; // Default to -1 if not provided
    this.attributes = this.parseAttributes(tag);
    this.relativeParsedPosition = this.calculateRelativeParsedPosition(segment);
  }

  /**
   * Parses attributes from a tag string.
   *
   * Extracts key-value pairs from tag strings like "person id='123' type='proper'".
   * Handles both single and double quotes around attribute values.
   *
   * @param tagString - The tag string to parse attributes from
   * @returns Object containing parsed attributes
   */
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
      const equalIndex = part.indexOf("=");

      if (equalIndex > 0) {
        const key = part.substring(0, equalIndex);
        let value = part.substring(equalIndex + 1);

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        attributes[key] = value;
      }
    }

    return attributes;
  }

  /**
   * Calculates the position of this tag in the parsed (tag-free) text.
   *
   * This method accounts for the length of all tags that appear before this tag
   * in the raw text, providing the position where this tag would appear in
   * the clean, parsed text without any XML-like tags.
   *
   * @param segment - The segment containing this tag
   * @returns The relative position in parsed text
   */
  private calculateRelativeParsedPosition(segment?: Segment): number {
    if (!segment) {
      return 0;
    }

    // Calculate the parsed position by subtracting the length of all tags that come before this tag
    let parsedPosition = this.position;

    // Subtract length of all opening tags before this position
    for (const tag of segment.openingTags) {
      if (tag.position < this.position) {
        parsedPosition -= tag.getTagLength();
      }
    }

    // Subtract length of all closing tags before this position
    for (const tag of segment.closingTags) {
      if (tag.position < this.position) {
        parsedPosition -= tag.getTagLength();
      }
    }

    return parsedPosition;
  }

  /**
   * Generates the complete tag string for this tag.
   *
   * For closing tags, returns the closing tag format (e.g., "</person>").
   * For opening tags, includes all attributes in the format (e.g., '<person id="123" type="proper">').
   *
   * @returns The complete tag string
   */
  getTag(): string {
    if (this.closing) {
      return `</${this.getTagName()}>`;
    }
    let openTag = `<${this.getTagName()}`;
    for (const [key, value] of Object.entries(this.attributes)) {
      openTag += ` ${key}="${value}"`;
    }
    openTag += ">";
    return openTag;
  }

  getTagLength(): number {
    return this.getTag().length;
  }

  /**
   * Gets the base tag name without attributes.
   *
   * Extracts just the tag name from the parsed tag content.
   * For example, if tag contains "div id='123' class='container'", this returns "div".
   *
   * @returns The base tag name
   */
  getTagName(): string {
    // Split by whitespace and take the first part (the tag name)
    return this.tagContent.trim().split(/\s+/)[0];
  }

  /**
   * Sets the attributes for this tag.
   *
   * Updates the attributes object with the provided key-value pairs.
   * This method allows modifying tag attributes after the tag has been created.
   *
   * @param attributes - Object containing the new attributes to set
   *
   * @example
   * // Set new attributes
   * tag.setAttributes({id: "123", class: "highlight"});
   *
   * // Update existing attributes
   * tag.setAttributes({id: "456"});
   */
  setAttributes(attributes: Record<string, string>): void {
    this.attributes = { ...this.attributes, ...attributes };
  }
}

/**
 * Represents a segment of text that can contain XML-like tags.
 * A segment is a portion of text that gets processed and displayed as lines.
 */
export class Segment {
  lineStart: number = -1; // incl.
  lineEnd: number = -1; // incl.
  raw: string;
  parsed: string = "";
  openingTags: Tag[] = [];
  closingTags: Tag[] = [];
  lines: string[] = [];
  segmentIndex: number = -1; // index of this segment in the text

  /**
   * Creates a new Segment from raw text.
   *
   * @param text - The raw text content for this segment
   * @param segmentIndex - The index of this segment in the text
   */
  constructor(text: string, segmentIndex: number = -1) {
    this.raw = text;
    this.segmentIndex = segmentIndex;
    this.parseText();
  }

  /**
   * Parses the raw text to extract tags and create clean parsed text.
   *
   * This method identifies opening and closing tags using regex patterns,
   * creates Tag objects for each found tag, and generates a clean parsed
   * version of the text with all tags removed.
   */
  parseText() {
    this.openingTags = [];
    this.closingTags = [];

    // Create new regex instances to avoid global flag state issues
    const openingRegex = createOpeningTagRegex();
    const closingRegex = new RegExp(
      closingTagRegex.source,
      closingTagRegex.flags
    );

    // Find opening tags
    let match;
    while ((match = openingRegex.exec(this.raw)) !== null) {
      this.openingTags.push(
        new Tag(match.index, match[1], false, this, this.segmentIndex)
      );
    }

    // Find closing tags
    while ((match = closingRegex.exec(this.raw)) !== null) {
      this.closingTags.push(
        new Tag(match.index, match[1], true, this, this.segmentIndex)
      );
    }

    // Remove tags from the text
    this.parsed = this.raw.replace(tagRemovalRegex, "");
  }

  /**
   * Finds the parsed position (line and character) of a tag in the clean text.
   *
   * This method calculates where a tag would appear in the parsed (tag-free) text
   * by accounting for the length of all preceding tags and converting to 2D coordinates.
   *
   * @param tag - The tag to find the position for
   * @returns Object with x (character) and y (line) coordinates in parsed text
   */
  findTagParsedPosition(tag: Tag): { x: number; y: number } {
    // find abs position right after the <tag> in segment's text
    let parsedTextOpenPosition = this.openingTags
      .filter((t) => t.position < tag.position)
      .reduce((acc, cur) => {
        return acc - cur.getTagLength();
      }, tag.position);
    parsedTextOpenPosition = this.closingTags
      .filter((t) => t.position < tag.position)
      .reduce((acc, cur) => {
        return acc - cur.getTagLength();
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
 * Text provides more abstract control over the provided raw text.
 *
 * This class manages text content by breaking it into segments, handling
 * different edit modes (RAW, HIGHLIGHT, SEMI), and providing methods for
 * text manipulation, line calculation, and position tracking.
 */
class Text {
  mode: EditMode = EditMode.RAW;
  segments: Segment[];
  dirtySegment?: number;
  value: string;
  charsAtLine: number;
  noLines: number;

  /**
   * Creates a new Text instance from raw text content.
   *
   * @param value - The raw text content
   * @param charsAtLine - Maximum characters per line for text wrapping
   */
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

  /**
   * Updates the maximum characters per line and recalculates line breaks.
   *
   * @param charsAtLine - New maximum characters per line
   */
  updateCharsAtLine(charsAtLine: number) {
    this.charsAtLine = charsAtLine;
    this.calculateLines();
  }

  /**
   * Splits the raw text into segments based on newline characters.
   *
   * Each segment represents a line of text and gets parsed for tags.
   * This method is called when the text content changes.
   */
  prepareSegments() {
    const segmentsArray = this.value.split("\n");
    const segments: Segment[] = [];

    for (let i = 0; i < segmentsArray.length; i++) {
      const segmentText = segmentsArray[i];
      segments.push(new Segment(segmentText, i));
    }

    this.segments = segments;
  }

  /**
   * Reconstructs the raw text value from all segments.
   *
   * This method joins all segment raw content with newlines and
   * triggers a recalculation of line breaks.
   */
  assignValueFromSegments(): void {
    this.value = this.segments.map((s) => s.raw).join("\n");
    this.calculateLines();
  }

  /**
   * Calculates line breaks and organizes text into displayable lines.
   *
   * This method processes each segment, applies text wrapping based on
   * charsAtLine, handles different edit modes (RAW/HIGHLIGHT/SEMI), and
   * updates line numbering for all segments.
   *
   * TODO: Optimize to avoid full recalculation after single character changes
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

    this.noLines = this.segments.reduce<number>(
      (a, c) => a + c.lines.length,
      0
    );
  }

  /**
   * Converts cursor position to segment position.
   *
   * @param viewport - The current viewport information
   * @param cursor - The relative cursor coordinates
   * @returns Segment position or null if invalid
   */
  /**
   * Converts cursor position to segment position.
   * Cursor is expected to use absolute (document) coordinates for yLine.
   */
  cursorToIndex(
    _viewport: Viewport,
    cursor: IRelativeCoordinates
  ): SegmentPosition | null {
    const pos = this.getSegmentPosition(cursor.yLine, cursor.xLine);

    return pos;
  }

  /**
   * Gets the current line content at the cursor position.
   *
   * @param viewport - The current viewport information
   * @param cursor - The relative cursor coordinates
   * @returns The line content or null if invalid position
   */
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
   * Converts absolute coordinates to absolute text index.
   *
   * @param absCoords - The absolute coordinates (line, character)
   * @returns The absolute text index or -1 if invalid
   */
  getAbsTextIndex(absCoords: IAbsCoordinates): number {
    const pos = this.getSegmentPosition(absCoords.yLine, absCoords.xLine);
    if (!pos) {
      return -1;
    }

    return this.getAbsTextIndexFromPosition(pos);
  }

  /**
   * Converts segment position to absolute text index.
   *
   * @param segment - The segment position
   * @returns The absolute text index or -1 if invalid
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
   * Converts absolute text index to segment position.
   *
   * This method finds which segment contains the given text index and
   * calculates the corresponding line and character positions within that segment.
   *
   * @param absTextIndex - The absolute text index
   * @returns Segment position or null if invalid
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
              parsedTextIndex -= tag.getTag().length;
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
   * Gets the line content from a segment position.
   *
   * @param segment - The segment position
   * @returns The line content or empty string if invalid
   */
  getLineFromPosition(segment: SegmentPosition): string {
    return this.segments[segment.segmentIndex].lines[segment.lineIndex] || "";
  }

  getLineAndCharFromSegmentParsedIndex(
    segmentIndex: number,
    parsedIndex: number
  ): { lineIndex: number; charInLineIndex: number } | null {
    const segment = this.segments[segmentIndex];
    if (!segment) return null;
    const parsed = Math.max(0, Math.min(parsedIndex, segment.parsed.length));
    let remaining = parsed;
    for (let i = 0; i < segment.lines.length; i++) {
      const lineLen = segment.lines[i].length;
      if (remaining < lineLen) {
        return { lineIndex: i, charInLineIndex: remaining };
      }
      remaining -= lineLen;
    }
    const last = segment.lines.length - 1;
    return {
      lineIndex: last,
      charInLineIndex: segment.lines[last]?.length ?? 0,
    };
  }

  /**
   * Converts a segment position to viewport-relative cursor coordinates.
   * Returns xLine (character index in line) and yLine (line index relative to viewport start), or null if segment is missing.
   */
  positionToCursor(
    viewport: Viewport,
    pos: SegmentPosition
  ): { xLine: number; yLine: number } | null {
    const segment = this.segments[pos.segmentIndex];
    if (!segment) return null;
    const absLine = segment.lineStart + pos.lineIndex;
    return {
      xLine: pos.charInLineIndex,
      yLine: absLine - viewport.lineStart,
    };
  }

  /**
   * Converts absolute line index to segment position.
   *
   * This method finds the segment containing the given line and calculates
   * the corresponding positions, accounting for different edit modes and tags.
   *
   * @param absLineIndex - The absolute line index
   * @param charInLineIndex - Character position within the line (default: 0)
   * @param ignoreLastClosingTag - Whether to ignore the last closing tag (default: false)
   * @returns Segment position or null if invalid
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
          rawTextIndex += tag.getTagLength();
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
   * Gets the position of the last segment.
   *
   * @returns The last segment position or null if no segments exist
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
   * Gets the text content visible in the current viewport.
   *
   * @param viewport - The viewport information containing line range
   * @returns Array of lines visible in the viewport
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

  findWordOffsetsInXml(text: string, index: number): [number, number] {
    let i = index - 1;
    while (i >= 0 && text[i] !== "<" && text[i] !== ">") {
      i--;
    }
    const leftBound = i < 0 ? ">" : text[i];
    const tagStart = i;
    if (leftBound === "<") {
      const close = text.indexOf(">", tagStart);
      if (close !== -1) {
        if (index <= close) {
          return [-(index - tagStart), close - index];
        }
      }
    }
    const contentRegex = /[^\s,.<>]+/g;
    let match;
    const matches: { start: number; end: number }[] = [];
    while ((match = contentRegex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
    for (const { start, end } of matches) {
      if (index >= start && index < end) {
        return [-(index - start), end - index];
      }
      if (index === end && text[index] === "<") {
        const close = text.indexOf(">", index);
        if (close !== -1) {
          return [-(index - start), close - index + 1];
        }
        return [-(index - start), 0];
      }
      if (index === start - 1 && text[index] === ">") {
        const nextAngle = text.indexOf("<", index + 1);
        if (nextAngle !== -1) {
          return [0, nextAngle - index];
        }
        return [0, end - index];
      }
    }
    if (index < text.length && text[index] === "<") {
      const close = text.indexOf(">", index);
      if (close !== -1) {
        return [0, close - index + 1];
      }
      return [-1, 1];
    }
    if (index < text.length && text[index] === ">") {
      return [-1, 1];
    }
    return [0, 0];
  }

  findWordOffsets(text: string, index: number): [number, number] {
    const wordRegex = /[^\s,.]+/g;
    let match;
    const matches = [];
    while ((match = wordRegex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
    let wordIndices;
    for (let i = 0; i < matches.length; i++) {
      const { start, end } = matches[i];
      if (index >= start && index < end) {
        wordIndices = { start, end };
        break;
      }
    }
    if (!wordIndices) {
      return [0, 0];
    }
    const startOffset = index - wordIndices.start;
    const endOffset = wordIndices.end - index;
    return [-startOffset, endOffset];
  }

  /**
   * Gets word boundaries for the word under the cursor.
   *
   * @param viewport - The current viewport information
   * @param cursor - The relative cursor coordinates
   * @returns Tuple of [startOffset, endOffset] for the word under cursor
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
      return this.findWordOffsetsInXml(text, textIndex);
    }
    return this.findWordOffsetsInXml(text, textIndex);
  }

  /**
   * Inserts text at the cursor position.
   *
   * @param viewport - The current viewport information
   * @param cursorPosition - The relative cursor coordinates
   * @param textToInsert - The text to insert
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
   * Inserts a newline character at the cursor position, creating a new segment.
   *
   * @param viewport - The current viewport information
   * @param cursorPosition - The relative cursor coordinates
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

  /**
   * Deletes a segment at the specified index.
   *
   * @param index - The index of the segment to delete
   */
  deleteSegment(index: number) {
    this.segments = this.segments
      .slice(0, index)
      .concat(this.segments.slice(index + 1));
  }

  /**
   * Deletes a single character at the cursor position.
   *
   * For deleting multiple characters, use deleteRangeText as it's more efficient.
   *
   * @param viewport - The current viewport information
   * @param cursorPosition - The relative cursor coordinates
   * @param forwardChar - Whether to delete forward (default: backward)
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
   * Gets text content within the specified absolute coordinate range.
   *
   * @param start - The start coordinates of the range
   * @param end - The end coordinates of the range
   * @returns The text content within the range
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

  /**
   * Deletes text within the specified absolute coordinate range.
   *
   * @param start - The start coordinates of the range to delete
   * @param end - The end coordinates of the range to delete
   */
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

  /**
   * Finds the position of a specific tag occurrence.
   *
   * @param tag - The tag name to search for
   * @param index - The occurrence index (0-based, default: 0)
   * @returns Array containing start and end coordinates of the tag, or empty array if not found
   */
  getTagPosition(tag: string, index: number = 0): IAbsCoordinates[] {
    let openingTagMatch: { tag: Tag; segment: Segment } | null = null;
    let closingTagMatch: { tag: Tag; segment: Segment } | null = null;

    let openingTagIndex = 0;
    let closingTagIndex = 0;

    // Search for the opening tag
    for (const segment of this.segments) {
      for (const openingTag of segment.openingTags) {
        if (openingTag.getTagName() === tag) {
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
        if (closingTag.getTagName() === tag) {
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
