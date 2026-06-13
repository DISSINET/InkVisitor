/**
 * Characterization tests — Phase 2, Task 2.4 (wrapping <-> cursor).
 *
 * These lock the CURRENT interaction between line wrapping and the
 * visual<->document coordinate converters, plus tag-position queries, as a
 * safety net before the cursor-model refactor (see
 * packages/annotator/BASIC_EDITOR_BACKLOG.md). The Phase 3 offset model is built
 * directly on these converters, so the round-trip guarantees captured here are
 * the contract that refactor must preserve.
 *
 * They assert what the editor does today, not necessarily what is "ideal".
 */
import { Annotator } from "../lib/Annotator";
import Text from "../lib/Text";
import { EditMode } from "../lib/constants";

const mk = (text: string, mode: EditMode = EditMode.RAW): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(mode);
  return a;
};
const key = (a: Annotator, k: string, mods: Partial<KeyboardEvent> = {}) =>
  a.keys.onKeyDown({
    key: k,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    code: "",
    preventDefault: () => {},
    ...mods,
  } as KeyboardEvent);

// positionToCursor only reads viewport.lineStart; with 0 the visual yLine equals
// the absolute line index.
const vp = { lineStart: 0 } as any;

describe("characterization: char-break wrapping", () => {
  test("an over-long word is character-broken at the width", () => {
    const t = new Text("supercalifragilistic", 10); // 20 chars, width 10
    expect(t.segments[0].lines).toEqual(["supercalif", "ragilistic"]);
    expect(t.noLines).toBe(2);
  });

  test("HIGHLIGHT mode strips tags before wrapping", () => {
    const t = new Text("ab<x>hello</x>cd", 100);
    t.mode = EditMode.HIGHLIGHT;
    t.calculateLines();
    expect(t.segments[0].lines).toEqual(["abhellocd"]);
  });
});

describe("characterization: raw-offset round-trip", () => {
  test("every raw offset round-trips across a wrapped single segment", () => {
    const input = "supercalifragilistic"; // wrapped to 2 lines at width 10
    const t = new Text(input, 10);
    for (let i = 0; i <= input.length; i++) {
      const pos = t.getSegmentFromAbsTextIndex(i);
      expect(pos).not.toBeNull();
      expect(t.getAbsTextIndexFromPosition(pos)).toBe(i);
    }
  });

  test("every raw offset round-trips across a wrapped multi-segment doc", () => {
    const input = "supercalifragilistic\nanotherlongword";
    const t = new Text(input, 10);
    // 2 segments, each char-broken into 2 visual lines.
    expect(t.noLines).toBe(4);
    expect(t.segments.map((s) => s.lines)).toEqual([
      ["supercalif", "ragilistic"],
      ["anotherlon", "gword"],
    ]);
    for (let i = 0; i <= input.length; i++) {
      const pos = t.getSegmentFromAbsTextIndex(i);
      expect(pos).not.toBeNull();
      expect(t.getAbsTextIndexFromPosition(pos)).toBe(i);
    }
  });

  test("every raw offset round-trips in HIGHLIGHT mode with tags", () => {
    const input = "ab<x>hello</x>cd";
    const t = new Text(input, 100);
    t.mode = EditMode.HIGHLIGHT;
    t.calculateLines();
    for (let i = 0; i <= input.length; i++) {
      const pos = t.getSegmentFromAbsTextIndex(i);
      expect(pos).not.toBeNull();
      expect(t.getAbsTextIndexFromPosition(pos)).toBe(i);
    }
  });
});

describe("characterization: visual-position round-trip", () => {
  test("every visual (line,col) round-trips across a wrapped segment", () => {
    const input = "supercalifragilistic";
    const t = new Text(input, 10);
    for (let y = 0; y < t.noLines; y++) {
      const lineLen = t.segments[0].lines[y].length;
      for (let x = 0; x <= lineLen; x++) {
        const pos = t.getSegmentPosition(y, x);
        expect(pos).not.toBeNull();
        const cur = t.positionToCursor(vp, pos!);
        expect(cur).toEqual({ xLine: x, yLine: y });
      }
    }
  });
});

describe("characterization: getTagPosition", () => {
  test("returns the parsed tag bounds, identical in RAW and HIGHLIGHT", () => {
    const input = "ab<x>hello</x>cd";

    const tRaw = new Text(input, 100);
    tRaw.mode = EditMode.RAW;
    tRaw.calculateLines();

    const tHl = new Text(input, 100);
    tHl.mode = EditMode.HIGHLIGHT;
    tHl.calculateLines();

    const expected = [
      { xLine: 2, yLine: 0 },
      { xLine: 7, yLine: 0 },
    ];
    expect(tRaw.getTagPosition("x")).toEqual(expected);
    expect(tHl.getTagPosition("x")).toEqual(expected);
  });

  test("returns an empty array for an unmatched tag", () => {
    const t = new Text("ab<x>hello</x>cd", 100);
    expect(t.getTagPosition("nope")).toEqual([]);
  });
});

describe("characterization: caret stays within width while a word grows", () => {
  test("typing a word past the width char-breaks and keeps the caret in bounds", () => {
    const a = mk("");
    a.text.updateCharsAtLine(10);
    for (const ch of "abcdefghijklmn") {
      key(a, ch);
      expect(a.cursor.xLine).toBeLessThanOrEqual(a.text.charsAtLine);
    }
    expect(a.text.value).toBe("abcdefghijklmn");
    expect(a.text.segments[0].lines).toEqual(["abcdefghij", "klmn"]);
    expect({ x: a.cursor.xLine, y: a.cursor.yLine }).toEqual({ x: 4, y: 1 });
  });
});
