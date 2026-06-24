/**
 * Phase 5 (proportional text) — P5.1 wiring into Text.
 *
 * Text owns one prefix-width table per visual line, built in `calculateLines`
 * from an injected measurer. The table is built ONLY when a measurer is present
 * (the `proportional` flag is on); the monospace path leaves it empty so its
 * behavior is untouched. Conversions resolve an ABSOLUTE visual line to the
 * owning segment + relative line, exactly like `getLine`.
 */
import Text from "./lib/Text";
import { MonospaceMeasurer, TextMeasurer } from "./lib/TextMeasurer";

// 'W' is wide (20), every other char is 10.
const proportional: TextMeasurer = {
  measure: (t: string) =>
    [...t].reduce((a, c) => a + (c === "W" ? 20 : 10), 0),
};

describe("Text proportional prefix tables", () => {
  test("no measurer: prefix tables are not built (monospace path untouched)", () => {
    const t = new Text("aWb", 100);
    expect(t.segments[0].linePrefixes).toEqual([]);
  });

  test("with measurer: builds a per-line prefix table from the measurer", () => {
    const t = new Text("aWb", 100, proportional);
    expect(t.segments[0].linePrefixes).toEqual([[0, 10, 30, 40]]);
  });

  test("columnToPixelX converts a column on a single line", () => {
    const t = new Text("aWb", 100, proportional);
    expect(t.columnToPixelX(0, 0)).toBe(0);
    expect(t.columnToPixelX(0, 1)).toBe(10);
    expect(t.columnToPixelX(0, 2)).toBe(30);
    expect(t.columnToPixelX(0, 3)).toBe(40);
  });

  test("pixelWidthOfLine returns the line's pixel right edge", () => {
    const t = new Text("aWb", 100, proportional);
    expect(t.pixelWidthOfLine(0)).toBe(40);
  });

  test("pixelXToColumn applies the midpoint bias on the wide glyph", () => {
    const t = new Text("aWb", 100, proportional);
    expect(t.pixelXToColumn(0, 19)).toBe(1); // left half of 'W'
    expect(t.pixelXToColumn(0, 20)).toBe(2); // midpoint -> next column
  });

  test("resolves an absolute visual line across newline segments", () => {
    const t = new Text("ab\ncd", 100, new MonospaceMeasurer(10));
    expect(t.columnToPixelX(0, 2)).toBe(20); // seg0 'ab'
    expect(t.columnToPixelX(1, 2)).toBe(20); // seg1 'cd'
  });

  test("resolves wrapped visual lines within one segment", () => {
    // P5.2: with a measurer, wrapping is by PIXEL budget (maxPixelWidth), not
    // charsAtLine. 30px / 10px-per-char -> 'abc','def'.
    const t = new Text("abcdef", 999, new MonospaceMeasurer(10), 30);
    expect(t.columnToPixelX(1, 3)).toBe(30);
    expect(t.pixelWidthOfLine(1)).toBe(30);
  });

  test("setMeasurer(undefined) clears the prefix tables; setMeasurer(m) rebuilds", () => {
    const t = new Text("aWb", 100, proportional);
    t.setMeasurer(undefined);
    expect(t.segments[0].linePrefixes).toEqual([]);
    t.setMeasurer(proportional);
    expect(t.segments[0].linePrefixes).toEqual([[0, 10, 30, 40]]);
  });
});

describe("Text proportional wrapping (P5.2)", () => {
  test("wraps by measured pixel width, not character count", () => {
    // 30px budget, each char 10px -> 3 chars per visual line
    const t = new Text("abcdef", 999, proportional, 30);
    expect(t.segments[0].lines).toEqual(["abc", "def"]);
  });

  test("a wide glyph causes an earlier wrap", () => {
    // 'W'=20, others 10; budget 30. 'a'(10)+'W'(20)=30 fits, 'b' overflows.
    const t = new Text("aWb", 999, proportional, 30);
    expect(t.segments[0].lines).toEqual(["aW", "b"]);
  });

  test("ultra-narrow budget still advances at least one char per line", () => {
    // single char (10px) wider than the 5px budget -> 1 char/line, no infinite loop
    const t = new Text("abc", 999, proportional, 5);
    expect(t.segments[0].lines).toEqual(["a", "b", "c"]);
  });

  test("prefix tables match the proportionally wrapped lines", () => {
    const t = new Text("abcdef", 999, proportional, 30);
    expect(t.segments[0].linePrefixes).toEqual([
      [0, 10, 20, 30],
      [0, 10, 20, 30],
    ]);
  });

  test("monospace path (no measurer) still wraps by charsAtLine", () => {
    const t = new Text("abcdef", 3);
    expect(t.segments[0].lines).toEqual(["abc", "def"]);
  });

  test("respects whitespace break opportunities under a pixel budget", () => {
    // "ab cd" budget 30: 'ab'(20)+space(10)=30 fits, 'cd' breaks to next line.
    const t = new Text("ab cd", 999, proportional, 30);
    expect(t.segments[0].lines).toEqual(["ab ", "cd"]);
  });

  test("wrapping uses the per-character additive basis, consistent with the prefix table", () => {
    // 'ff' is a 15px ligature measured whole, but 20px per-char. Wrapping must use
    // the per-char basis (the prefix table's basis) so caret/selection x agree with
    // where lines break. Budget 18: additive 20 > 18 -> must wrap to 'f','f'.
    const kerning: TextMeasurer = {
      measure: (t: string) => (t === "ff" ? 15 : [...t].length * 10),
    };
    const t = new Text("ff", 999, kerning, 18);
    expect(t.segments[0].lines).toEqual(["f", "f"]);
  });

  test("glyphWidthAt returns the cell width at a column (for drag-handle tolerance)", () => {
    const t = new Text("aWb", 100, proportional); // prefix [0,10,30,40]
    expect(t.glyphWidthAt(0, 0)).toBe(10); // 'a'
    expect(t.glyphWidthAt(0, 1)).toBe(20); // 'W'
    expect(t.glyphWidthAt(0, 2)).toBe(10); // 'b'
  });

  test("glyphWidthAt at/after the line end falls back to the last cell width", () => {
    const t = new Text("aWb", 100, proportional);
    expect(t.glyphWidthAt(0, 3)).toBe(10); // line end -> last glyph 'b'
  });

  test("glyphWidthAt returns 0 on the monospace path (no measurer)", () => {
    const t = new Text("abc", 100);
    expect(t.glyphWidthAt(0, 1)).toBe(0);
  });

  test("multi-code-unit graphemes are code-unit columns (documented limitation — §5.9)", () => {
    // The annotator's column model is UTF-16 code-unit based (xLine === .length),
    // so the prefix table has one entry per code unit. '👍' is 2 code units -> 3
    // entries. Proper grapheme handling is deferred to §5.9 (Intl.Segmenter/pretext).
    const t = new Text("👍", 999, proportional);
    expect(t.segments[0].linePrefixes[0].length).toBe("👍".length + 1);
  });
});
