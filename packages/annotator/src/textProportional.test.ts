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
    const t = new Text("abcdef", 3, new MonospaceMeasurer(10)); // 'abc','def'
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
