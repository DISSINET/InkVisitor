/**
 * Paragraph first-line indent (#2076).
 *
 * A paragraph is one segment — the span between two hard newlines — and every
 * other visual line inside it is a soft wrap. Left-aligned text shows no
 * difference between the two, so the first line of each paragraph is indented
 * and its wrapped continuations stay flush left.
 */
import { Annotator } from "./lib/Annotator";
import Text from "./lib/Text";
import { EditMode, PARAGRAPH_INDENT_MAX_RATIO } from "./lib/constants";

const MAXLEN = 20;

/** A Text on the monospace grid, where the indent unit is a character column. */
const mkText = (value: string, indent: number, mode = EditMode.RAW): Text => {
  const t = new Text(value, MAXLEN);
  t.mode = mode;
  t.setParagraphIndent(indent);
  return t;
};

const mkAnnotator = (value: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, value);
  a.setMode(EditMode.RAW);
  return a;
};

describe("which lines carry the indent", () => {
  test("a paragraph's first line is indented, its wrapped lines are not", () => {
    const t = mkText("first para\nsecond paragraph that wraps over lines", 4);
    // segment 1 starts at line 1 (segment 0 is the single-line first paragraph)
    const start = t.segments[1].lineStart;
    expect(t.lineXOrigin(start)).toBe(4);
    expect(t.lineXOrigin(start + 1)).toBe(0);
    expect(t.lineXOrigin(start + 2)).toBe(0);
  });

  test("the document's first paragraph stays flush", () => {
    const t = mkText("first paragraph here\nsecond", 4);
    expect(t.lineXOrigin(0)).toBe(0);
  });

  test("a paragraph already starting with typed spaces is not indented again", () => {
    const t = mkText("first\n    typed in as spaces\nrendered indent", 4);
    expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(0);
    expect(t.lineXOrigin(t.segments[2].lineStart)).toBe(4);
  });

  test("a single leading space is incidental and the paragraph still indents", () => {
    // One space is a typo, not hand-typed indentation; two spaces or a tab are.
    const t = mkText("first\n one space lead\n  two spaces\n\ttab lead", 4);
    expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(4);
    expect(t.lineXOrigin(t.segments[2].lineStart)).toBe(0);
    expect(t.lineXOrigin(t.segments[3].lineStart)).toBe(0);
  });

  test("a whitespace-only paragraph is empty, not single-space-led", () => {
    const t = mkText("first\n \nthird", 4);
    expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(0);
    expect(t.lineXOrigin(t.segments[2].lineStart)).toBe(4);
  });

  test("markup does not change where a paragraph sits", () => {
    // The paragraph's raw text starts with a tag, its parsed text with a space.
    // Both modes read the parsed text, so switching mode never shifts the line.
    const value = "first\n<x>    tagged then spaces</x>";
    expect(mkText(value, 4, EditMode.RAW).lineXOrigin(1)).toBe(0);
    expect(mkText(value, 4, EditMode.HIGHLIGHT).lineXOrigin(1)).toBe(0);
  });

  test("a paragraph holding only an anchor tag is flush in every mode", () => {
    // What line 3177 of a real document looks like: one anchor tag, no prose.
    const value = "first\n</f4fc7fb6-c0b4-4caa-997a-0d0d7754494a>\nthird";
    for (const mode of [EditMode.RAW, EditMode.HIGHLIGHT, EditMode.SEMI]) {
      const t = mkText(value, 4, mode);
      expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(0);
      expect(t.lineXOrigin(t.segments[2].lineStart)).toBe(4);
    }
  });

  test("an empty paragraph is not indented", () => {
    const t = mkText("first\n\n\nfourth paragraph", 4);
    expect(t.lineXOrigin(1)).toBe(0);
    expect(t.lineXOrigin(2)).toBe(0);
    expect(t.lineXOrigin(3)).toBe(4);
  });

  test("no indent reported while the setting is off", () => {
    const t = mkText("first\nsecond paragraph", 0);
    expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(0);
  });
});

describe("wrapping around the indent", () => {
  test("the indented line holds fewer characters than the ones below it", () => {
    const value = "first\n" + "ab ".repeat(20).trim();
    const plain = mkText(value, 0);
    const indented = mkText(value, 6);
    // Trailing wrap whitespace is collapsed in the margin past the visible
    // edge, so a line's visible length is what the budget bounds.
    const firstLineOf = (t: Text) => t.segments[1].lines[0].trimEnd();

    expect(firstLineOf(plain).length).toBe(MAXLEN);
    expect(firstLineOf(indented).length).toBeLessThanOrEqual(MAXLEN - 6);
    // The continuation lines keep the full width.
    expect(indented.segments[1].lines[1].trimEnd().length).toBeGreaterThan(
      firstLineOf(indented).length
    );
  });

  test("nothing on an indented line overflows the panel", () => {
    const t = mkText("first\n" + "ab ".repeat(20).trim(), 6);
    for (const segment of t.segments) {
      segment.lines.forEach((line, i) => {
        const origin = t.lineXOrigin(segment.lineStart + i);
        expect(origin + line.trimEnd().length).toBeLessThanOrEqual(MAXLEN);
      });
    }
  });

  test("a word too wide for the indented line moves down whole", () => {
    // "wordthatisfifteen" (17) fits a full 20-wide line but not the 14 left
    // after the indent, so it starts the next line instead of being broken.
    const t = mkText("first\nab wordthatisfifteen", 6);
    expect(t.segments[1].lines[0].trimEnd()).toBe("ab");
    expect(t.segments[1].lines[1]).toBe("wordthatisfifteen");
  });

  test("a tag too wide for the indented line is broken, not run off the edge", () => {
    // 16 chars: fits a full 20-wide line but not the 15 left after the indent —
    // the window where a tag measured against the full width would be appended
    // to the indented line and overhang it. In XML mode, where every anchor is
    // a tag carrying an id, that window is where the long ones land.
    const tag = '<person id="12">';
    const t = mkText(`first\n${tag}name`, 5);
    const seg = t.segments[1];
    seg.lines.forEach((line, i) => {
      const origin = t.lineXOrigin(seg.lineStart + i);
      expect(origin + line.trimEnd().length).toBeLessThanOrEqual(MAXLEN);
    });
    // The pieces still reconstruct the paragraph exactly.
    expect(seg.lines.join("")).toBe(`${tag}name`);
  });

  test("an indent wider than a quarter of the line is capped", () => {
    const t = mkText("first\nsecond paragraph that wraps", MAXLEN - 1);
    expect(t.lineXOrigin(t.segments[1].lineStart)).toBe(
      Math.floor(MAXLEN * PARAGRAPH_INDENT_MAX_RATIO)
    );
  });
});

describe("positions on an indented line", () => {
  test("a click resolves the column the indent shifted it to", () => {
    const a = mkAnnotator("first paragraph\nsecond paragraph");
    const indentPx = a.text.lineXOrigin(1) * a.charWidth;
    expect(indentPx).toBeGreaterThan(0);

    // Column 3 of the second paragraph sits three characters past the indent.
    a.onMouseDoubleClick({
      offsetX: (indentPx + 3 * a.charWidth) / a.ratio,
      offsetY: 1.5 * (a.lineHeight / a.ratio),
      preventDefault: () => {},
    } as unknown as MouseEvent);
    // Double-click selects the word under that column — "second" (cols 0..6).
    expect(a.cursor.selectStart).toEqual({ xLine: 0, yLine: 1 });
    expect(a.cursor.selectEnd).toEqual({ xLine: 6, yLine: 1 });
  });

  test("a click left of the indent lands on column 0, not off the line", () => {
    const a = mkAnnotator("first paragraph\nsecond paragraph");
    const indentPx = a.text.lineXOrigin(1) * a.charWidth;
    a.cursor.setPositionFromCanvasOffsets(
      0,
      1.5 * (a.lineHeight / a.ratio),
      a.lineHeight,
      a.charWidth,
      0,
      0,
      undefined,
      () => indentPx
    );
    expect({ xLine: a.cursor.xLine, yLine: a.cursor.yLine }).toEqual({
      xLine: 0,
      yLine: 1,
    });
  });
});

describe("toggling", () => {
  test("turning the indent off re-wraps and restores the flush layout", () => {
    const a = mkAnnotator("first\nsecond paragraph");
    a.text.updateCharsAtLine(MAXLEN);
    const indentedLines = a.text.segments[1].lines.slice();

    a.setParagraphIndent(false);
    expect(a.text.lineXOrigin(1)).toBe(0);
    expect(a.getParagraphIndent()).toBe(false);

    a.setParagraphIndent(true);
    expect(a.text.segments[1].lines).toEqual(indentedLines);
  });

  test("the caret keeps its document offset across the re-wrap", () => {
    const a = mkAnnotator("first\n" + "ab ".repeat(20).trim());
    a.text.updateCharsAtLine(MAXLEN);
    a.cursor.moveToOffset(a.text, 30);

    a.setParagraphIndent(false);
    expect(a.cursor.head).toBe(30);
    expect(a.text.offsetFromVisual(a.cursor.xLine, a.cursor.yLine)).toBe(30);
  });
});

describe("paragraph marks", () => {
  test("the end of every paragraph is a paragraph end, wrapped lines are not", () => {
    const t = mkText("first\nsecond paragraph that wraps over lines", 4);
    expect(t.isParagraphEnd(0)).toBe(true); // single-line first paragraph
    const last = t.segments[1].lineEndExclusive - 1;
    expect(t.isParagraphEnd(last)).toBe(true);
    expect(t.isParagraphEnd(last - 1)).toBe(false);
  });

  test("the toggle is off by default and persists through a redraw", () => {
    const a = mkAnnotator("first\nsecond");
    expect(a.getShowParagraphMarks()).toBe(false);
    a.setShowParagraphMarks(true);
    expect(a.getShowParagraphMarks()).toBe(true);
  });
});
