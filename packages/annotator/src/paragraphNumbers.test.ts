/**
 * The gutter numbers paragraphs (#3305): one number per newline-separated
 * paragraph, empty ones included, drawn on the paragraph's first visual line.
 * Soft-wrapped continuation lines stay blank, so the numbers do not shift when
 * the wrap width changes.
 */
import Text from "./lib/Text";
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

describe("Text.paragraphNumberStartingAt", () => {
  test("numbers each paragraph on its first visual line only, empty paragraphs included", () => {
    // 30px budget: "abcdef" wraps to "abc" / "def"; "" is an empty paragraph.
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    expect(t.noLines).toBe(4);
    expect([0, 1, 2, 3].map((l) => t.paragraphNumberStartingAt(l))).toEqual([1, undefined, 2, 3]);
  });

  test("lines outside the document have no paragraph number", () => {
    const t = new Text("a\nb", 999, tenPx, 30);
    expect(t.paragraphNumberStartingAt(-1)).toBeUndefined();
    expect(t.paragraphNumberStartingAt(2)).toBeUndefined();
  });

  test("paragraph numbers stay put when the wrap width changes", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    const before = [0, 1, 2].map((l) => t.paragraphNumberStartingAt(l));
    expect(before).toEqual([1, undefined, 2]);

    t.updateMaxPixelWidth(100);
    expect(t.noLines).toBe(2);
    expect([0, 1].map((l) => t.paragraphNumberStartingAt(l))).toEqual([1, 2]);
  });
});

describe("Lines gutter draws paragraph numbers", () => {
  test("draws the paragraph number on its first row and leaves wrapped rows blank", () => {
    const t = new Text("abcdef\n\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(0, 4), (l) => t.paragraphNumberStartingAt(l));

    expect(calls.map((c) => c.s)).toEqual(["1", "2", "3"]);
    // rows 0, 2, 3 at (row + 0.5) * lineHeight; row 1 is the wrap of paragraph 1
    expect(calls.map((c) => c.y)).toEqual([10, 50, 70]);
  });

  test("a viewport scrolled into a paragraph's wrap starts with the next paragraph's number", () => {
    const t = new Text("abcdef\nxy", 999, tenPx, 30);
    const { lines, calls } = mkLines(20);
    lines.draw(viewport(1, 3), (l) => t.paragraphNumberStartingAt(l));

    expect(calls).toEqual([{ s: "2", x: 0, y: 30 }]);
  });
});
