/**
 * The gutter numbers paragraphs (#3305): one number per non-empty
 * newline-separated paragraph, drawn on the paragraph's first visual line.
 * Empty lines take no number, and soft-wrapped continuation lines stay blank, so
 * the numbers do not shift when the wrap width changes.
 */
import Text from "./lib/Text";
import { EditMode } from "./lib/constants";
import { Lines } from "./lib/Lines";
import Viewport from "./lib/Viewport";
import { TextMeasurer } from "./lib/TextMeasurer";

const tenPx: TextMeasurer = {
  measure: (t) => t.length * 10,
};

const mkLines = (lineHeight: number) => {
  const calls: { s: string; x: number; y: number }[] = [];
  const ctx = {
    reset() {},
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    font: "",
    fillStyle: "",
    textBaseline: "",
    fillText: (s: string, x: number, y: number) => calls.push({ s, x, y }),
  };
  const el = {
    width: 40,
    height: 600,
    style: {},
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { lines: new Lines(el, 1, lineHeight, 10), calls };
};

const viewport = (lineStart: number, lineEnd: number) =>
  ({ scrollOffsetY: 0, lineStart, lineEnd } as unknown as Viewport);

const numbersOf = (t: Text) =>
  Array.from({ length: t.noLines }, (_, l) => t.paragraphNumberStartingAt(l));

describe("Text.paragraphNumberStartingAt", () => {
  test("numbers each non-empty paragraph on its first visual line only", () => {
    // 30px budget: "abcdef" wraps to "abc" / "def"; "" is an empty line.
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    expect(t.noLines).toBe(4);
    expect(numbersOf(t)).toEqual([1, undefined, undefined, 2]);
  });

  test("empty lines do not advance the count", () => {
    const t = new Text("\n\na\n\n\nb\n", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([
      undefined,
      undefined,
      1,
      undefined,
      undefined,
      2,
      undefined,
    ]);
  });

  test("a line holding only tags is empty in every mode", () => {
    const t = new Text("<x>\nab</x>\ncd", 999, tenPx, 30);
    for (const mode of [EditMode.RAW, EditMode.HIGHLIGHT, EditMode.SEMI]) {
      t.mode = mode;
      t.calculateLines();
      expect(t.paragraphNumberStartingAt(0)).toBeUndefined();
      expect(t.paragraphNumberStartingAt(t.segments[1].lineStart)).toBe(1);
      expect(t.paragraphNumberStartingAt(t.segments[2].lineStart)).toBe(2);
    }
  });

  test("numbers follow edits that empty or fill a line", () => {
    const t = new Text("a\nb\nc", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([1, 2, 3]);

    t.value = "a\n\nc";
    t.prepareSegments();
    t.calculateLines();
    expect(numbersOf(t)).toEqual([1, undefined, 2]);
  });

  test("lines outside the document have no paragraph number", () => {
    const t = new Text("a\nb", 999, tenPx, 30);
    expect(t.paragraphNumberStartingAt(-1)).toBeUndefined();
    expect(t.paragraphNumberStartingAt(2)).toBeUndefined();
  });

  test("paragraph numbers stay put when the wrap width changes", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    expect(numbersOf(t)).toEqual([1, undefined, 2]);

    t.updateMaxPixelWidth(100);
    expect(numbersOf(t)).toEqual([1, 2]);
  });
});

describe("Lines gutter draws paragraph numbers", () => {
  test("draws the paragraph number on its first row and leaves wrapped and empty rows blank", () => {
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(0, 4), (l) => t.paragraphNumberStartingAt(l));

    expect(calls.map((c) => c.s)).toEqual(["1", "2"]);
    // rows 0 and 3 at (row + 0.5) * lineHeight; row 1 wraps paragraph 1, row 2 is empty
    expect(calls.map((c) => c.y)).toEqual([10, 70]);
  });

  test("a viewport scrolled into a paragraph's wrap starts with the next paragraph's number", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(1, 3), (l) => t.paragraphNumberStartingAt(l));

    expect(calls).toEqual([{ s: "2", x: 0, y: 30 }]);
  });
});
