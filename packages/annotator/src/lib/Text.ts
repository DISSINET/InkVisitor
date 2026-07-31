import Viewport from "./Viewport";
import { IAbsCoordinates, IRelativeCoordinates } from "./Highlighter";
import { EditMode, PARAGRAPH_INDENT_MAX_RATIO } from "./constants";
import {
  closingTagRegex,
  createOpeningTagRegex,
  tagRemovalRegex,
  wrapTokenRegex,
} from "./Annotator";
import {
  TextMeasurer,
  buildPrefixWidths,
  additiveWidth,
  columnToPixelX as prefixColumnToPixelX,
  pixelXToColumn as prefixPixelXToColumn,
  pixelWidthOfLine as prefixPixelWidthOfLine,
} from "./TextMeasurer";

/**
 * Caret affinity at a soft-wrap boundary, where a single document offset maps to
 * two visual positions:
 * - `UPSTREAM`   — render at the END of the wrapped visual line.
 * - `DOWNSTREAM` — render at the START of the following visual line.
 * Irrelevant for any offset that is not a soft-wrap boundary.
 */
export enum CaretAffinity {
  UPSTREAM = "UPSTREAM",
  DOWNSTREAM = "DOWNSTREAM",
}

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
   * Returns absolute raw-text position of this tag in the whole document.
   *
   * @param segments - All text segments in order
   * @returns Absolute raw-text index
   */
  getAbsoluteTagPosition(segments: Segment[]): number {
    let absoluteIndex = this.position;
    for (let i = 0; i < this.segmentIndex; i++) {
      absoluteIndex += segments[i].raw.length + 1;
    }
    return absoluteIndex;
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
  lineStart: number = -1; // inclusive — first visual line index of this segment
  /** Exclusive — one past the last visual line index of this segment (`lineStart + lines.length`). */
  lineEndExclusive: number = -1;
  raw: string;
  parsed: string = "";
  openingTags: Tag[] = [];
  closingTags: Tag[] = [];
  lines: string[] = [];
  /**
   * Per-line cumulative pixel offsets, parallel to {@link lines}.
   * `linePrefixes[i][c]` is the pixel x of column `c` on visual line `i`.
   * Empty unless a proportional measurer is active (monospace path is untouched).
   */
  linePrefixes: number[][] = [];
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
   * When set, {@link calculateLines} wraps by measured pixel width and
   * builds per-line prefix-width tables, and the column↔pixel converters use
   * measured widths. When absent the annotator stays on the legacy monospace
   * grid (wrap by {@link charsAtLine}; `col * charWidth`).
   */
  measurer?: TextMeasurer;
  /**
   * Wrap budget in device pixels, used instead of {@link charsAtLine}
   * when a {@link measurer} is active. Undefined means "no width limit".
   */
  maxPixelWidth?: number;
  /**
   * First-line indent of a paragraph (#2076), in the same unit as the wrap
   * budget: device px while a {@link measurer} is active, character columns on
   * the monospace grid. 0 disables the indent. The caller converts to that unit
   * (see `Annotator.paragraphIndentUnits`), which keeps this one number valid
   * both for shortening the first line's wrap budget and — via
   * {@link lineXOrigin} — for placing everything drawn on that line.
   */
  paragraphIndent: number = 0;

  /**
   * Creates a new Text instance from raw text content.
   *
   * @param value - The raw text content
   * @param charsAtLine - Maximum characters per line (monospace wrap budget)
   * @param measurer - Optional proportional measurer. When omitted the
   *   monospace grid is used and no prefix tables are built.
   * @param maxPixelWidth - Proportional wrap budget in device px.
   */
  constructor(
    value: string,
    charsAtLine: number,
    measurer?: TextMeasurer,
    maxPixelWidth?: number
  ) {
    this.value = value;
    this.segments = [];
    this.prepareSegments();
    this.charsAtLine = charsAtLine;
    this.measurer = measurer;
    this.maxPixelWidth = maxPixelWidth;
    this.noLines = 0;
    this.calculateLines();
  }

  /**
   * Swap the proportional measurer (or clear it to return to the
   * monospace grid) and rebuild lines/prefix tables. Pass `maxPixelWidth` to
   * update the proportional wrap budget at the same time.
   */
  setMeasurer(measurer?: TextMeasurer, maxPixelWidth?: number) {
    this.measurer = measurer;
    // Clear the budget when leaving proportional mode (state hygiene — it is
    // only read while a measurer is set), otherwise update it when provided.
    if (!measurer) {
      this.maxPixelWidth = undefined;
    } else if (maxPixelWidth !== undefined) {
      this.maxPixelWidth = maxPixelWidth;
    }
    this.calculateLines();
  }

  /**
   * Set the paragraph first-line indent (#2076) in wrap-budget units and
   * re-wrap — the indent shortens that line, so the break positions move with it.
   */
  setParagraphIndent(indent: number) {
    this.paragraphIndent = indent;
    this.calculateLines();
  }

  /**
   * Indent applied to a paragraph's first line. Three paragraphs get none:
   * - the document's first, which has nothing above it to be confused with (the
   *   same reason typesetting leaves an opening paragraph flush);
   * - one whose text already begins with whitespace, since some documents were
   *   written with the indent typed in as spaces and would otherwise double it;
   * - one with no text at all, which has no start to mark. A blank line, or a
   *   line holding only an anchor tag, would otherwise show its caret, selection
   *   sliver and anchor markers nudged off the text column.
   *
   * The decision reads the segment's PARSED text in every mode, so a paragraph
   * sits at the same x whichever mode the document is viewed in: markup is
   * structure, not the prose the indent marks the start of.
   */
  private indentForSegment(segment: Segment): number {
    const text = segment.parsed;
    if (
      !this.paragraphIndent ||
      segment.segmentIndex === 0 ||
      text === "" ||
      /^\s/.test(text)
    ) {
      return 0;
    }
    return Math.min(
      this.paragraphIndent,
      Math.floor(this.wrapBudget() * PARAGRAPH_INDENT_MAX_RATIO)
    );
  }

  /**
   * Full width available to a visual line, in the unit the active mode wraps in
   * — device px under a {@link measurer}, character columns otherwise. Mirrors
   * the `maxWidth` {@link calculateLines} wraps against.
   */
  private wrapBudget(): number {
    return this.measurer
      ? Math.max(1, this.maxPixelWidth ?? Infinity)
      : Math.max(1, this.charsAtLine);
  }

  /**
   * Horizontal origin of an absolute visual line, in wrap-budget units: the
   * paragraph indent on a paragraph's first line, 0 on its soft-wrapped
   * continuations. Everything drawn on the line — the text, the caret, selection
   * and anchor rects — is shifted by it, and mouse x is un-shifted by it.
   */
  lineXOrigin(absLine: number): number {
    if (!this.paragraphIndent) {
      return 0;
    }
    const segment = this.segments.find(
      (s) => s.lineStart <= absLine && s.lineEndExclusive > absLine
    );
    if (!segment || absLine !== segment.lineStart) {
      return 0;
    }
    return this.indentForSegment(segment);
  }

  /**
   * Does `absLine` hold the end of a paragraph, i.e. is it the last visual line
   * of its segment? True for the last line of the document as well — the
   * document's final paragraph ends there even without a trailing newline.
   */
  isParagraphEnd(absLine: number): boolean {
    const segment = this.segments.find(
      (s) => s.lineStart <= absLine && s.lineEndExclusive > absLine
    );
    return !!segment && absLine === segment.lineEndExclusive - 1;
  }

  /**
   * Update the proportional wrap budget (device px) and re-wrap.
   * Used on resize; no-op effect on the monospace path.
   */
  updateMaxPixelWidth(maxPixelWidth: number) {
    this.maxPixelWidth = maxPixelWidth;
    this.calculateLines();
  }

  /**
   * Prefix-width table for an absolute visual line, or undefined (monospace).
   * The line is clamped into `[0, noLines-1]` so a hit-test for a click past the
   * document edge resolves against the nearest line (draw always passes a valid
   * line, so the clamp is a no-op there).
   */
  private prefixForLine(absLine: number): number[] | undefined {
    const clamped = Math.max(0, Math.min(absLine, Math.max(0, this.noLines - 1)));
    const segment = this.segments.find(
      (s) => s.lineStart <= clamped && s.lineEndExclusive > clamped
    );
    return segment?.linePrefixes[clamped - segment.lineStart];
  }

  /**
   * Pixel x of column `col` on absolute visual line `absLine`.
   * Returns 0 when no prefix table exists (only used in proportional mode).
   */
  columnToPixelX(absLine: number, col: number): number {
    const prefix = this.prefixForLine(absLine);
    return prefix ? prefixColumnToPixelX(prefix, col) : 0;
  }

  /** Nearest column for a pixel x on absolute visual line `absLine`. */
  pixelXToColumn(absLine: number, x: number): number {
    const prefix = this.prefixForLine(absLine);
    return prefix ? prefixPixelXToColumn(prefix, x) : 0;
  }

  /** Pixel right edge of absolute visual line `absLine`. */
  pixelWidthOfLine(absLine: number): number {
    const prefix = this.prefixForLine(absLine);
    return prefix ? prefixPixelWidthOfLine(prefix) : 0;
  }

  /**
   * Measured width (device px) of the cell at column `col` on line
   * `absLine`, used for drag-handle grab tolerance. At/after the line end (and
   * for col<0) it falls back to the nearest real cell so the tolerance never
   * collapses to 0. Returns 0 on the monospace path (no prefix table).
   */
  glyphWidthAt(absLine: number, col: number): number {
    const prefix = this.prefixForLine(absLine);
    if (!prefix || prefix.length < 2) {
      return 0;
    }
    const lastCell = prefix.length - 2; // index of the last [c, c+1] cell
    const c = Math.max(0, Math.min(col, lastCell));
    return prefix[c + 1] - prefix[c];
  }

  /**
   * Returns the line at the specified index by iterating over segments
   * @param lineIndex The absolute line index
   * @returns The line at the specified index or an empty string if not found
   */
  getLine(lineIndex: number): string {
    // Find the segment that contains the line
    const segmentIndex = this.segments.findIndex(
      (s) => s.lineStart <= lineIndex && s.lineEndExclusive > lineIndex
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
   * Clamps a raw visual position into the document: `yLine` into `[0, noLines-1]`
   * and `xLine` into `[0, lineLength]` of the resolved line (#3108).
   */
  clampVisual(xLine: number, yLine: number): IAbsCoordinates {
    const y = Math.max(0, Math.min(yLine, Math.max(0, this.noLines - 1)));
    const lineLen = (this.getLine(y) ?? "").length;
    const x = Math.max(0, Math.min(xLine, lineLen));
    return { xLine: x, yLine: y };
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

    // Width basis for wrapping. Monospace: 1 code unit = 1 unit,
    // budget = charsAtLine (byte-identical to the legacy loop). Proportional:
    // measured pixels via `additiveWidth` (per code unit — the SAME basis as the
    // prefix table), budget = maxPixelWidth, so line breaks agree with the
    // caret/selection x-offsets the prefix table produces (within-token kerning
    // is ignored; grapheme handling deferred — see TextMeasurer.additiveWidth).
    // `widthOf`/`maxWidth`/`charsThatFit` are the only difference between the two
    // modes; everything else is shared.
    const measurer = this.measurer;
    const widthOf = measurer
      ? (s: string) => additiveWidth(s, measurer)
      : (s: string) => s.length;
    const maxWidth = measurer
      ? Math.max(1, this.maxPixelWidth ?? Infinity)
      : Math.max(1, this.charsAtLine);
    // Largest code-unit count of `s` whose measured width fits `budget`.
    // Monospace reduces to min(len, budget) — i.e. the legacy `maxLen - used`.
    // Iterates code units (s[n]) like the prefix table; grapheme-aware splitting
    // is deferred.
    const charsThatFit = (s: string, budget: number): number => {
      if (!measurer) {
        return Math.max(0, Math.min(s.length, budget));
      }
      let acc = 0;
      let n = 0;
      while (n < s.length) {
        const w = measurer.measure(s[n]);
        if (acc + w > budget) break;
        acc += w;
        n++;
      }
      return n;
    };

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
        segmentIndex === 0
          ? 0
          : this.segments[segmentIndex - 1].lineEndExclusive;
      segment.lines = [];

      let text = segment.raw;
      if (this.mode === EditMode.HIGHLIGHT || this.mode === EditMode.SEMI) {
        text = segment.parsed;
      }

      // Word wrapping like a normal text editor (issues #2780 / follow-up).
      //
      // The annotator has no horizontal scroll, so wrapping is the only thing
      // keeping content (and the cursor) inside the visible width. A line break
      // is only allowed next to whitespace; a word together with the
      // punctuation glued to it ("ds.") is therefore one unbreakable unit that
      // wraps to the next line as a whole rather than letting the punctuation
      // (and the caret after it) spill past the budget. A unit longer than the
      // whole line is broken character-wise so nothing ever exceeds the width.

      // Atomic tokens: tags (<...>) must never be split; word, punctuation and
      // whitespace runs are kept separate so we can find break opportunities.
      type Tok = { text: string; space: boolean; atomic: boolean };
      const toks: Tok[] = [];
      wrapTokenRegex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = wrapTokenRegex.exec(text)) !== null) {
        if (m[1] !== undefined)
          toks.push({ text: m[1], space: false, atomic: true });
        else if (m[2] !== undefined)
          toks.push({ text: m[2], space: true, atomic: false });
        else if (m[3] !== undefined)
          toks.push({ text: m[3], space: false, atomic: false });
        else toks.push({ text: m[4], space: false, atomic: false });
      }

      // Merge adjacent non-space tokens into unbreakable units; whitespace runs
      // are their own cells (the only place a break may occur).
      type Cell = { text: string; space: boolean; parts: Tok[] };
      const cells: Cell[] = [];
      for (const t of toks) {
        const last = cells[cells.length - 1];
        if (!t.space && last && !last.space) {
          last.text += t.text;
          last.parts.push(t);
        } else {
          cells.push({ text: t.text, space: t.space, parts: [t] });
        }
      }
      // The paragraph's first visual line starts at the indent, so it has that
      // much less room; the wrapped continuations get the full width. Read as a
      // function of how many lines are already pushed so it follows pushLine.
      const indent = this.indentForSegment(segment);
      const lineBudget = () =>
        maxWidth - (segment.lines.length === 0 ? indent : 0);

      let currentLine: string[] = [];
      let currentLineLength = 0;
      const pushLine = () => {
        segment.lines.push(currentLine.join(""));
        currentLine = [];
        currentLineLength = 0;
      };
      const appendStr = (s: string) => {
        currentLine.push(s);
        currentLineLength += widthOf(s);
      };

      for (let ci = 0; ci < cells.length; ci++) {
        const cell = cells[ci];

        if (currentLineLength + widthOf(cell.text) <= lineBudget()) {
          appendStr(cell.text);
          continue;
        }

        if (cell.space) {
          // A soft wrap never starts a line with whitespace (Google-Docs
          // style): an overflowing inter-word space run stays as trailing
          // whitespace on the current line, collapsed into the margin past the
          // visible edge. The next non-space cell then begins the following
          // line flush-left, so no wrapped line is ever led by a wrap space.
          appendStr(cell.text);
          continue;
        }

        // Budget of the line this unit would land on: a push leaves line 0
        // behind, so the fresh line is a full-width continuation.
        const targetBudget = currentLineLength > 0 ? maxWidth : lineBudget();
        if (widthOf(cell.text) <= targetBudget) {
          // Move the whole unit down to a fresh line.
          if (currentLineLength > 0) pushLine();
          appendStr(cell.text);
          continue;
        }

        // Unit longer than a whole line: break it. A tag is kept whole when it
        // fits on a line, but a tag longer than the line is still broken — with
        // no horizontal scroll, an unsplit over-long tag would run off the edge.
        for (const part of cell.parts) {
          // "Fits on a line" is judged against the line the part would land on:
          // the indented first line of a paragraph holds less than the
          // full-width continuation a pushLine would open. A tag measured
          // against the full width and then appended to the indented line would
          // run past the right edge before any break — visible in XML mode,
          // where a tag carrying a UUID is long enough to sit in that gap.
          const partBudget = currentLineLength > 0 ? maxWidth : lineBudget();
          if (part.atomic && widthOf(part.text) <= partBudget) {
            if (
              currentLineLength > 0 &&
              currentLineLength + widthOf(part.text) > lineBudget()
            )
              pushLine();
            appendStr(part.text);
          } else {
            let s = part.text;
            while (currentLineLength + widthOf(s) > lineBudget()) {
              // Chars that still fit the remaining budget; force at least one on
              // an empty line so an over-wide glyph can't loop forever (#narrow).
              const fit = charsThatFit(s, lineBudget() - currentLineLength);
              const take = currentLineLength === 0 ? Math.max(1, fit) : fit;
              if (take > 0) {
                appendStr(s.slice(0, take));
                s = s.slice(take);
              }
              pushLine();
            }
            if (s.length) appendStr(s);
          }
        }
      }
      if (currentLine.length > 0) pushLine();

      segment.lineEndExclusive =
        segment.lineStart + (segment.lines.length || 1);

      if (!segment.lines.length) {
        segment.lines = [""];
      }

      // Build the per-line prefix-width tables (proportional only).
      // Left empty on the monospace path so draw/hit-test keep using charWidth.
      segment.linePrefixes = measurer
        ? segment.lines.map((line) => buildPrefixWidths(line, measurer))
        : [];
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

        // Calculate parsed text index by counting the characters that tag
        // removal strips from the raw text up to this index. We derive this
        // from `tagRemovalRegex` — the exact pattern used to build `parsed`
        // (`raw.replace(tagRemovalRegex, "")`) — so the two stay consistent
        // even for malformed tags. A closing tag carrying attributes
        // (`</first elvl="1">`) is stripped from `parsed` by tagRemovalRegex
        // but matches neither the strict opening nor closing regex, so it
        // never lands in `openingTags`/`closingTags`; reconstructing the
        // removed length from those lists both misses such tags and uses the
        // canonical (attribute-stripped) tag length, drifting the caret.
        let parsedTextIndex = rawTextIndex;
        if (this.mode !== EditMode.RAW) {
          const removalRegex = new RegExp(
            tagRemovalRegex.source,
            tagRemovalRegex.flags
          );
          let removalMatch: RegExpExecArray | null;
          while ((removalMatch = removalRegex.exec(segment.raw)) !== null) {
            if (removalMatch.index > rawTextIndex) {
              break;
            }
            parsedTextIndex -= removalMatch[0].length;
          }
          // Note: parsedTextIndex may go negative when rawTextIndex sits on a
          // leading tag (the `<= rawTextIndex` boundary subtracts a tag that
          // starts exactly there); the return value clamps it, matching the
          // previous tracked-tag computation. Only the malformed-tag accounting
          // differs from before.
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
   * Raw document offset (index into {@link value}) to
   * ABSOLUTE visual coordinates (`yLine` is an absolute line index, not
   * viewport-relative). The offset is clamped into `[0, value.length]`. The
   * returned `xLine` is the visual column in the current edit mode (tags are
   * stripped in HIGHLIGHT/SEMI). Returns `null` only for an empty document.
   */
  visualFromOffset(
    offset: number,
    affinity: CaretAffinity = CaretAffinity.DOWNSTREAM
  ): { xLine: number; yLine: number } | null {
    const clamped = Math.max(0, Math.min(offset, this.value.length));
    const pos = this.getSegmentFromAbsTextIndex(clamped);
    if (!pos) {
      return null;
    }
    const segment = this.segments[pos.segmentIndex];
    if (!segment) {
      return null;
    }
    let lineIndex = pos.lineIndex;
    // An offset that lands inside hidden tag markup (HIGHLIGHT/SEMI) can yield a
    // negative parsed column; snap it to the line start so the caret never sits
    // at a negative column.
    let charInLineIndex = Math.max(0, pos.charInLineIndex);
    // At a soft-wrap boundary (start of a continuation line) UPSTREAM affinity
    // renders the caret at the end of the previous visual line instead.
    if (
      affinity === CaretAffinity.UPSTREAM &&
      lineIndex > 0 &&
      charInLineIndex === 0
    ) {
      lineIndex -= 1;
      charInLineIndex = segment.lines[lineIndex].length;
    }
    return {
      xLine: charInLineIndex,
      yLine: segment.lineStart + lineIndex,
    };
  }

  /**
   * ABSOLUTE visual coordinates to a raw document offset.
   * Returns `-1` when the line index is out of bounds (uses the non-clamping
   * {@link getSegmentPositionOrNull}). Inverse of {@link visualFromOffset}.
   */
  offsetFromVisual(xLine: number, yLine: number): number {
    const pos = this.getSegmentPositionOrNull(yLine, xLine);
    return pos ? this.getAbsTextIndexFromPosition(pos) : -1;
  }

  /**
   * One VISIBLE column to the right of an absolute visual
   * position, crossing visual line boundaries. Works in every mode (a "visible
   * column" is a parsed column in HIGHLIGHT/SEMI, a raw column in RAW); the
   * caller converts the result back to a raw offset, which skips hidden markup.
   * At end-of-document the position is unchanged.
   */
  stepVisualRight(
    xLine: number,
    yLine: number
  ): { xLine: number; yLine: number } {
    const lineLen = (this.getLine(yLine) ?? "").length;
    if (xLine < lineLen) {
      return { xLine: xLine + 1, yLine };
    }
    // At end of the visual line: drop to the start of the next one, or stay at EOF.
    if (yLine >= this.noLines - 1) {
      return { xLine: lineLen, yLine };
    }
    return { xLine: 0, yLine: yLine + 1 };
  }

  /**
   * One VISIBLE column to the left of an absolute visual
   * position, crossing visual line boundaries. At document start it is unchanged.
   */
  stepVisualLeft(
    xLine: number,
    yLine: number
  ): { xLine: number; yLine: number } {
    if (xLine > 0) {
      return { xLine: xLine - 1, yLine };
    }
    if (yLine <= 0) {
      return { xLine: 0, yLine: 0 };
    }
    const prevLen = (this.getLine(yLine - 1) ?? "").length;
    return { xLine: prevLen, yLine: yLine - 1 };
  }

  /**
   * Caret navigation one visible column LEFT. Steps left, and if that
   * step only flipped affinity across a soft-wrap boundary — it landed on the same
   * offset, the shared "end of the previous line == start of this line" position —
   * steps once more so the caret reaches a real earlier column: the second-to-last
   * position of the previous line, the Word-style behavior where a wrapped line's
   * end and the next line's start are one position. At a hard newline / mid-line the
   * first step already changed the offset, so it stops after one step. Used for both
   * a collapsed caret and a growing (shift) selection.
   */
  caretStepLeft(
    xLine: number,
    yLine: number
  ): { offset: number; affinity: CaretAffinity } {
    const beforeOffset = this.offsetFromVisual(xLine, yLine);
    let next = this.stepVisualLeft(xLine, yLine);
    let info = this.offsetWithAffinityFromVisual(next.xLine, next.yLine);
    if (info.offset === beforeOffset) {
      next = this.stepVisualLeft(next.xLine, next.yLine);
      info = this.offsetWithAffinityFromVisual(next.xLine, next.yLine);
    }
    return info;
  }

  /**
   * Caret navigation one visible column RIGHT. It mirrors {@link caretStepLeft}:
   * a soft-wrap boundary is ONE logical position (the wrapped line's end and the
   * next line's start are the same document offset), so the caret walks it as it
   * would the raw text — one offset per step, never resting twice at that offset.
   * Just as Left from a continuation-line start lands on the second-to-LAST
   * position of the previous line, Right from a wrapped line end lands on the
   * SECOND position of the next line.
   *
   * - `extend` (shift-selection): if the step only flipped affinity, step once
   *   more so the selection grows by a real char (a trailing wrap space is stepped
   *   through and stays visibly selected).
   * - Collapsed caret, stepping INTO the boundary from the position just before it:
   *   if that wrapped line ends in a wrap WHITESPACE, render the boundary at the
   *   next line's start (DOWNSTREAM) instead of past the invisible trailing space;
   *   if it ends in a VISIBLE char (a mid-word break), stop at the line end after
   *   that char. `\s` matches the same whitespace class the wrap tokenizer
   *   ({@link wrapTokenRegex}) breaks on.
   * - Collapsed caret, already AT the boundary (the step only flipped affinity to
   *   the same offset): step once more so the caret advances into the next line
   *   rather than resting a second time at the one boundary offset. This applies to
   *   whitespace- and visible-char-ending wraps alike, keeping Left/Right symmetric.
   */
  caretStepRight(
    xLine: number,
    yLine: number,
    extend: boolean
  ): { offset: number; affinity: CaretAffinity } {
    const beforeOffset = this.offsetFromVisual(xLine, yLine);
    let next = this.stepVisualRight(xLine, yLine);
    let info = this.offsetWithAffinityFromVisual(next.xLine, next.yLine);
    if (extend) {
      if (info.offset === beforeOffset) {
        next = this.stepVisualRight(next.xLine, next.yLine);
        info = this.offsetWithAffinityFromVisual(next.xLine, next.yLine);
      }
    } else if (
      info.affinity === CaretAffinity.UPSTREAM &&
      /\s$/.test(this.getLine(next.yLine))
    ) {
      info = { offset: info.offset, affinity: CaretAffinity.DOWNSTREAM };
    } else if (info.offset === beforeOffset) {
      next = this.stepVisualRight(next.xLine, next.yLine);
      info = this.offsetWithAffinityFromVisual(next.xLine, next.yLine);
    }
    return info;
  }

  /**
   * Is `offset` a soft-wrap boundary, i.e. the start of a
   * continuation visual line WITHIN a segment (not a hard `\n` boundary, which
   * begins a new segment at lineIndex 0)? Such offsets have two visual caret
   * positions distinguished by {@link CaretAffinity}.
   */
  isWrapBoundary(offset: number): boolean {
    const clamped = Math.max(0, Math.min(offset, this.value.length));
    const pos = this.getSegmentFromAbsTextIndex(clamped);
    if (!pos) {
      return false;
    }
    return pos.lineIndex > 0 && pos.charInLineIndex === 0;
  }

  /**
   * ABSOLUTE visual coordinates to a document offset PLUS
   * the affinity that visual position implies: the end of a wrapped (non-last)
   * visual line is UPSTREAM, everything else DOWNSTREAM. Inverse companion of
   * {@link visualFromOffset} that recovers the affinity bit lost by a bare offset.
   */
  offsetWithAffinityFromVisual(
    xLine: number,
    yLine: number
  ): { offset: number; affinity: CaretAffinity } {
    const offset = this.offsetFromVisual(xLine, yLine);
    if (offset < 0) {
      return { offset, affinity: CaretAffinity.DOWNSTREAM };
    }
    const pos = this.getSegmentPositionOrNull(yLine, xLine);
    if (pos) {
      const segment = this.segments[pos.segmentIndex];
      const lineLen = segment?.lines[pos.lineIndex]?.length ?? 0;
      const isLastVisualLineOfSegment =
        !segment || pos.lineIndex >= segment.lines.length - 1;
      if (xLine >= lineLen && !isLastVisualLineOfSegment) {
        return { offset, affinity: CaretAffinity.UPSTREAM };
      }
    }
    return { offset, affinity: CaretAffinity.DOWNSTREAM };
  }

  /**
   * Non-clamping variant of {@link getSegmentPosition}: returns `null` when
   * `absLineIndex` falls outside `[0, noLines - 1]` instead of clamping it into
   * range. Use this when a `null` return is meant to signal "invalid position"
   * (the offset-model code relies on this); the clamping variant
   * stays for existing callers that depend on the old behavior.
   *
   * @param absLineIndex - The absolute line index
   * @param charInLineIndex - Character position within the line (default: 0)
   * @param ignoreLastClosingTag - Whether to ignore the last closing tag (default: false)
   * @returns Segment position, or `null` if the line index is out of bounds
   */
  getSegmentPositionOrNull(
    absLineIndex: number,
    charInLineIndex: number = 0,
    ignoreLastClosingTag: boolean = false
  ): SegmentPosition | null {
    if (
      this.noLines <= 0 ||
      absLineIndex < 0 ||
      absLineIndex >= this.noLines
    ) {
      return null;
    }
    return this.getSegmentPosition(
      absLineIndex,
      charInLineIndex,
      ignoreLastClosingTag
    );
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
    // sanitize bounds: absLineIndex is a valid line index in [0, noLines - 1]
    if (this.noLines <= 0) {
      absLineIndex = 0;
    } else {
      if (absLineIndex < 0) {
        absLineIndex = 0;
      } else if (absLineIndex >= this.noLines) {
        absLineIndex = this.noLines - 1;
      }
    }

    const segmentIndex = this.segments.findLastIndex(
      (s) => s.lineStart <= absLineIndex && s.lineEndExclusive > absLineIndex
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
      if (
        segment.lineEndExclusive <= startLine ||
        segment.lineStart >= endLine
      ) {
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
    const renderEndCond = viewport.lineEnd - viewport.lineStart;
    const out: string[] = [];
    for (let renderLine = 0; renderLine <= renderEndCond; renderLine++) {
      const absLine = viewport.lineStart + renderLine;
      if (this.noLines <= 0 || absLine < 0 || absLine >= this.noLines) {
        out.push("");
        continue;
      }
      const pos = this.getSegmentPosition(absLine, 0);
      if (!pos) {
        out.push("");
        continue;
      }
      const seg = this.segments[pos.segmentIndex];
      out.push(seg.lines[pos.lineIndex] ?? "");
    }
    return out;
  }

  /**
   * Returns [leftOffset, rightOffset] for word/tag boundaries around `index`
   * in XML-aware text. Tags (<...>) are treated as single tokens; content words
   * are delimited by whitespace, commas, dots, and angle brackets.
   * Returns [0, 0] when the index is on whitespace with no adjacent token.
   */
  findWordOffsetsInXml(text: string, index: number): [number, number] {
    // Walk left to find the nearest angle bracket
    let i = index - 1;
    while (i >= 0 && text[i] !== "<" && text[i] !== ">") {
      i--;
    }
    const leftBound = i < 0 ? ">" : text[i];
    const tagStart = i;

    // Inside a tag: select from `<` to `>`
    if (leftBound === "<") {
      const close = text.indexOf(">", tagStart);
      if (close !== -1 && index <= close) {
        return [-(index - tagStart), close - index];
      }
    }

    // Match content words (anything except whitespace, commas, dots, angle brackets)
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
      // Cursor at end of content word, immediately followed by a tag
      if (index === end && text[index] === "<") {
        const close = text.indexOf(">", index);
        if (close !== -1) {
          return [-(index - start), close - index + 1];
        }
        return [-(index - start), 0];
      }
      // Cursor on `>` right before a content word
      if (index === start - 1 && text[index] === ">") {
        const nextAngle = text.indexOf("<", index + 1);
        if (nextAngle !== -1) {
          return [0, nextAngle - index];
        }
        return [0, end - index];
      }
    }

    // Cursor directly on `<` with no preceding content match — select whole tag
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

    if (textToInsert.includes("\n")) {
      // Multi-line insert (e.g. pasting text with newlines): re-split the whole
      // document from the updated value so the newlines become real segment
      // boundaries — a targeted single-segment splice would leave a stray "\n"
      // embedded in one segment's raw.
      this.prepareSegments();
    } else {
      segment.raw =
        segment.raw.slice(0, segmentPosition.rawTextIndex) +
        textToInsert +
        segment.raw.slice(segmentPosition.rawTextIndex);
      segment.parseText();
    }
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
   * Only the real line breaks of the source (segment boundaries, i.e. the `\n`
   * in {@link value}) appear in the result. The soft-wrap breaks the annotator
   * inserts to fit text to the view width are NOT emitted - copying must yield
   * the natural paragraph/line breaks of the original, not view-imposed ones
   * Within a segment the wrapped visual lines are concatenated back together; segments are joined with a single `\n`.
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

    const startPos = this.getSegmentPosition(start.yLine, start.xLine);
    const endPos = this.getSegmentPosition(end.yLine, end.xLine);
    if (!startPos || !endPos) {
      return "";
    }

    const parts: string[] = [];
    for (let i = startPos.segmentIndex; i <= endPos.segmentIndex; i++) {
      // Joining the wrapped visual lines back together reconstructs the
      // segment's display text (raw in RAW mode, tag-free in HIGHLIGHT/SEMI)
      // without the soft-wrap breaks. calculateLines only ever partitions this
      // text, so no characters are lost or added.
      const display = this.segments[i].lines.join("");
      const from = i === startPos.segmentIndex ? startPos.parsedTextIndex : 0;
      const to =
        i === endPos.segmentIndex ? endPos.parsedTextIndex : display.length;
      parts.push(display.slice(from, to));
    }
    return parts.join("\n");
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

  /**
   * Validate anchors and return asymmetrical (broken) anchors
   * Detects orphaned opening tags and orphaned closing tags
   */
  validateAnchors(): Array<{
    tagName: string;
    type: 'orphaned-opening' | 'orphaned-closing';
    segmentIndex: number;
    position: number;
    attributes?: Record<string, string>;
  }> {
    const issues: Array<{
      tagName: string;
      type: 'orphaned-opening' | 'orphaned-closing';
      segmentIndex: number;
      position: number;
      attributes?: Record<string, string>;
    }> = [];

    const openingTagsByName = new Map<string, Tag[]>();
    const closingTagsByName = new Map<string, Tag[]>();

    // Collect all opening and closing tags
    for (const segment of this.segments) {
      for (const tag of segment.openingTags) {
        const name = tag.getTagName();
        if (!openingTagsByName.has(name)) {
          openingTagsByName.set(name, []);
        }
        openingTagsByName.get(name)!.push(tag);
      }

      for (const tag of segment.closingTags) {
        const name = tag.getTagName();
        if (!closingTagsByName.has(name)) {
          closingTagsByName.set(name, []);
        }
        closingTagsByName.get(name)!.push(tag);
      }
    }

    // Find orphaned opening tags
    for (const [tagName, openings] of openingTagsByName) {
      const closings = closingTagsByName.get(tagName) || [];
      if (openings.length > closings.length) {
        // More openings than closings - last ones are orphaned
        for (let i = closings.length; i < openings.length; i++) {
          const orphan = openings[i];
          issues.push({
            tagName,
            type: 'orphaned-opening',
            segmentIndex: orphan.segmentIndex,
            position: orphan.position,
            attributes: orphan.attributes,
          });
        }
      }
    }

    // Find orphaned closing tags
    for (const [tagName, closings] of closingTagsByName) {
      const openings = openingTagsByName.get(tagName) || [];
      if (closings.length > openings.length) {
        // More closings than openings - first ones are orphaned
        for (let i = openings.length; i < closings.length; i++) {
          const orphan = closings[i];
          issues.push({
            tagName,
            type: 'orphaned-closing',
            segmentIndex: orphan.segmentIndex,
            position: orphan.position,
            attributes: orphan.attributes,
          });
        }
      }
    }

    return issues;
  }
}

export default Text;
