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
