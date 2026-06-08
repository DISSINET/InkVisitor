/**
 * Phase 3 prerequisite — explicit out-of-bounds handling for line→position lookup.
 *
 * `getSegmentPosition` CLAMPS an out-of-range line index into [0, noLines-1],
 * which silently hides invalid positions from callers that test validity via a
 * null return. `getSegmentPositionOrNull` is the non-clamping variant the
 * offset-model refactor (Phase 3) relies on; the clamping variant stays for
 * existing callers.
 */
import Text from "./lib/Text";

const DOC = "abcde\nfghij\nklmno"; // 3 lines, no wrapping at width 100

describe("Text.getSegmentPositionOrNull", () => {
  test("returns null for a negative line index", () => {
    const t = new Text(DOC, 100);
    expect(t.getSegmentPositionOrNull(-1, 0)).toBeNull();
  });

  test("returns null for a line index at or past noLines", () => {
    const t = new Text(DOC, 100);
    expect(t.noLines).toBe(3);
    expect(t.getSegmentPositionOrNull(3, 0)).toBeNull();
    expect(t.getSegmentPositionOrNull(99, 0)).toBeNull();
  });

  test("returns the same position as getSegmentPosition for valid lines", () => {
    const t = new Text(DOC, 100);
    for (let y = 0; y < t.noLines; y++) {
      for (let x = 0; x <= 5; x++) {
        expect(t.getSegmentPositionOrNull(y, x)).toEqual(
          t.getSegmentPosition(y, x)
        );
      }
    }
  });

  test("does NOT clamp where getSegmentPosition silently would", () => {
    const t = new Text(DOC, 100);
    // getSegmentPosition clamps line 5 -> line 2; the OrNull variant must not.
    expect(t.getSegmentPosition(5, 0)).not.toBeNull();
    expect(t.getSegmentPositionOrNull(5, 0)).toBeNull();
  });

  test("returns null on an empty document for any non-zero line", () => {
    const t = new Text("", 100);
    expect(t.getSegmentPositionOrNull(1, 0)).toBeNull();
  });
});

describe("Segment.lineEndExclusive", () => {
  test("is exclusive: equals lineStart + number of visual lines", () => {
    const t = new Text("abcde\nfghij\nklmno", 100); // 3 unwrapped segments
    expect(t.segments).toHaveLength(3);
    t.segments.forEach((s) => {
      expect(s.lineEndExclusive).toBe(s.lineStart + s.lines.length);
    });
    // contiguous: each segment starts where the previous one ended.
    expect(t.segments[0].lineStart).toBe(0);
    expect(t.segments[0].lineEndExclusive).toBe(1);
    expect(t.segments[1].lineStart).toBe(1);
    expect(t.segments[2].lineEndExclusive).toBe(3);
    // last exclusive end equals the total line count.
    expect(t.segments[t.segments.length - 1].lineEndExclusive).toBe(t.noLines);
  });

  test("accounts for wrapped (multi-visual-line) segments", () => {
    const t = new Text("supercalifragilistic", 10); // 1 segment, 2 visual lines
    expect(t.segments).toHaveLength(1);
    expect(t.segments[0].lines).toHaveLength(2);
    expect(t.segments[0].lineStart).toBe(0);
    expect(t.segments[0].lineEndExclusive).toBe(2);
  });
});
