/**
 * The document-offset cursor model (ADDITIVE).
 *
 * These prove the offset<->visual converters and Cursor's sync helpers in
 * isolation, before navigation/editing are rewired onto them. The
 * canonical round-trip is offset -> visual -> offset (the soft-wrap boundary
 * means visual -> offset -> visual is intentionally NOT 1:1).
 */
import Text from "./lib/Text";
import Cursor, { DIRECTION } from "./lib/Cursor";
import { EditMode } from "./lib/constants";

describe("Text.visualFromOffset / offsetFromVisual", () => {
  test("offset round-trips through visual coords (unwrapped doc, RAW)", () => {
    const input = "abcde\nfghij\nklmno";
    const t = new Text(input, 100);
    for (let off = 0; off <= input.length; off++) {
      const v = t.visualFromOffset(off);
      expect(v).not.toBeNull();
      expect(t.offsetFromVisual(v!.xLine, v!.yLine)).toBe(off);
    }
  });

  test("offset round-trips across a wrapped multi-segment doc", () => {
    const input = "supercalifragilistic\nanotherlongword";
    const t = new Text(input, 10);
    for (let off = 0; off <= input.length; off++) {
      const v = t.visualFromOffset(off);
      expect(v).not.toBeNull();
      expect(t.offsetFromVisual(v!.xLine, v!.yLine)).toBe(off);
    }
  });

  // Every VALID caret position round-trips visual -> offset -> visual. This is
  // the invariant the offset model relies on (the cached visual state stays
  // stable). NB: the reverse (every raw offset -> visual -> offset) is NOT 1:1
  // in HIGHLIGHT — raw offsets inside hidden tag markup are not caret positions
  // and snap to a visible boundary instead (characterized below).
  test.each([
    ["RAW", EditMode.RAW],
    ["HIGHLIGHT", EditMode.HIGHLIGHT],
  ])("every caret position round-trips visual->offset->visual (%s)", (_n, mode) => {
    const t = new Text("ab<x>hello</x>cd", 100);
    t.mode = mode as EditMode;
    t.calculateLines();
    for (let y = 0; y < t.noLines; y++) {
      const lineLen = t.segments[0].lines[y].length;
      for (let x = 0; x <= lineLen; x++) {
        const off = t.offsetFromVisual(x, y);
        expect(off).toBeGreaterThanOrEqual(0);
        expect(t.visualFromOffset(off)).toEqual({ xLine: x, yLine: y });
      }
    }
  });

  test("a raw offset inside hidden markup snaps to a non-negative column (HIGHLIGHT)", () => {
    const t = new Text("ab<x>hello</x>cd", 100);
    t.mode = EditMode.HIGHLIGHT;
    t.calculateLines();
    // offset 2 is the '<' of "<x>" — inside hidden markup, not a caret position.
    const v = t.visualFromOffset(2);
    expect(v).not.toBeNull();
    expect(v!.xLine).toBeGreaterThanOrEqual(0);
    expect(v!.yLine).toBe(0);
  });

  test("yLine is an ABSOLUTE line index (spans segments)", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    expect(t.visualFromOffset(0)).toEqual({ xLine: 0, yLine: 0 });
    expect(t.visualFromOffset(6)).toEqual({ xLine: 0, yLine: 1 }); // start of "fghij"
    expect(t.visualFromOffset(12)).toEqual({ xLine: 0, yLine: 2 }); // start of "klmno"
    expect(t.visualFromOffset(17)).toEqual({ xLine: 5, yLine: 2 }); // EOF
  });

  test("a soft-wrap boundary offset maps to the start of the next visual line", () => {
    const t = new Text("supercalifragilistic", 10); // lines: 10 + 10
    expect(t.visualFromOffset(10)).toEqual({ xLine: 0, yLine: 1 });
    // ...and that visual position maps back to the same offset.
    expect(t.offsetFromVisual(0, 1)).toBe(10);
  });

  test("offset is clamped into [0, value.length]", () => {
    const t = new Text("abc", 100);
    expect(t.visualFromOffset(-5)).toEqual({ xLine: 0, yLine: 0 });
    expect(t.visualFromOffset(999)).toEqual({ xLine: 3, yLine: 0 });
  });

  test("offsetFromVisual returns -1 for an out-of-bounds line", () => {
    const t = new Text("abc", 100);
    expect(t.offsetFromVisual(0, 5)).toBe(-1);
    expect(t.offsetFromVisual(0, -1)).toBe(-1);
  });
});

describe("Cursor.syncVisualFromOffset", () => {
  test("a collapsed caret derives xLine/yLine and clears the selection", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    const c = new Cursor(1);
    c.anchor = 8;
    c.head = 8; // visual (2,1)
    c.selectStart = { xLine: 0, yLine: 0 }; // stale, must be cleared
    c.selectEnd = { xLine: 1, yLine: 0 };
    c.syncVisualFromOffset(t);
    expect({ x: c.xLine, y: c.yLine }).toEqual({ x: 2, y: 1 });
    expect(c.selectStart).toBeUndefined();
    expect(c.selectEnd).toBeUndefined();
  });

  test("a forward range derives ordered visual endpoints + direction", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    const c = new Cursor(1);
    c.anchor = 2; // visual (2,0)
    c.head = 8; // visual (2,1)
    c.syncVisualFromOffset(t);
    expect({ x: c.xLine, y: c.yLine }).toEqual({ x: 2, y: 1 }); // caret at head
    expect(c.selectStart).toEqual({ xLine: 2, yLine: 0 });
    expect(c.selectEnd).toEqual({ xLine: 2, yLine: 1 });
    expect(c.getSelectedArea()).toEqual([
      { xLine: 2, yLine: 0 },
      { xLine: 2, yLine: 1 },
    ]);
    expect(c.selectDirection).toBe(DIRECTION.FORWARD);
    expect(t.getRangeText(c.getAbsBounds()[0]!, c.getAbsBounds()[1]!)).toBe(
      "cde\nfg"
    );
  });

  test("a backward range (head before anchor) reports BACKWARD direction", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    const c = new Cursor(1);
    c.anchor = 8; // visual (2,1)
    c.head = 2; // visual (2,0)
    c.syncVisualFromOffset(t);
    expect({ x: c.xLine, y: c.yLine }).toEqual({ x: 2, y: 0 });
    expect(c.selectDirection).toBe(DIRECTION.BACKWARD);
    // getSelectedArea is document-ordered regardless of direction.
    expect(c.getSelectedArea()).toEqual([
      { xLine: 2, yLine: 0 },
      { xLine: 2, yLine: 1 },
    ]);
  });
});

describe("Cursor.syncOffsetFromVisual", () => {
  test("derives head and anchor from the current visual caret", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    const c = new Cursor(1);
    c.xLine = 2;
    c.yLine = 1; // offset 8
    c.syncOffsetFromVisual(t);
    expect(c.head).toBe(8);
    expect(c.anchor).toBe(8);
  });

  test("keepAnchor preserves the anchor (selection extension)", () => {
    const t = new Text("abcde\nfghij\nklmno", 100);
    const c = new Cursor(1);
    c.anchor = 2;
    c.xLine = 2;
    c.yLine = 1; // offset 8
    c.syncOffsetFromVisual(t, true);
    expect(c.head).toBe(8);
    expect(c.anchor).toBe(2);
  });

  test("offset -> visual -> offset is stable through the Cursor helpers", () => {
    const t = new Text("supercalifragilistic\nanotherlongword", 10);
    const c = new Cursor(1);
    for (let off = 0; off <= t.value.length; off++) {
      c.anchor = off;
      c.head = off;
      c.syncVisualFromOffset(t);
      c.syncOffsetFromVisual(t);
      expect(c.head).toBe(off);
    }
  });
});
