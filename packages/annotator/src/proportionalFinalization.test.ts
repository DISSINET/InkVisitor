/**
 * Proportional text: gutter + soft-wrap affinity.
 *
 * Verify-only / characterization locks (no behavior change): they confirm two
 * correctness properties of the proportional path and pin them against regressions.
 */
import Text, { CaretAffinity } from "./lib/Text";
import { Lines } from "./lib/Lines";
import Viewport from "./lib/Viewport";
import { TextMeasurer } from "./lib/TextMeasurer";

const proportional: TextMeasurer = {
  measure: (t) => [...t].reduce((s, c) => s + (c === "W" ? 20 : 10), 0),
};

// ── soft-wrap caret affinity under proportional ──────────────────────
describe("proportional soft-wrap caret affinity", () => {
  test("UPSTREAM affinity at a wrap boundary draws at the line's pixel right edge; DOWNSTREAM at the next line's start", () => {
    // 'abcdef' at 10px/char, 30px budget -> visual lines 'abc','def'.
    const t = new Text("abcdef", 999, proportional, 30);
    expect(t.segments[0].lines).toEqual(["abc", "def"]);

    const boundary = 3; // raw offset between 'abc' and 'def'

    const up = t.visualFromOffset(boundary, CaretAffinity.UPSTREAM);
    expect(up).toEqual({ xLine: 3, yLine: 0 }); // end of the wrapped line
    // Drawn at the prior line's pixel right edge (pixelWidthOfLine), never past it.
    expect(t.columnToPixelX(up!.yLine, up!.xLine)).toBe(30);
    expect(t.pixelWidthOfLine(0)).toBe(30);

    const down = t.visualFromOffset(boundary, CaretAffinity.DOWNSTREAM);
    expect(down).toEqual({ xLine: 0, yLine: 1 }); // start of the continuation line
    expect(t.columnToPixelX(down!.yLine, down!.xLine)).toBe(0);
  });

  test("the boundary column round-trips: clicking the wrapped line's right edge resolves to its end column", () => {
    const t = new Text("abcdef", 999, proportional, 30);
    // Click at the pixel right edge of line 0 -> last column of 'abc' (col 3).
    expect(t.pixelXToColumn(0, t.pixelWidthOfLine(0))).toBe(3);
  });
});

// ── line-number gutter is independent of proportional ─────────────────
describe("gutter is charWidth/proportional-independent", () => {
  const mkLines = (lineHeight: number, charWidth: number) => {
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
    return { lines: new Lines(el, 1, lineHeight, charWidth), calls };
  };

  test("draws one number per content line at lineHeight-based y and x=0, regardless of charWidth", () => {
    const vp = { scrollOffsetY: 0, lineStart: 0, lineEnd: 4 } as unknown as Viewport;

    // A huge charWidth must not move the gutter — it only uses lineHeight.
    const a = mkLines(20, 999);
    a.lines.draw(vp, 3); // 3 content lines
    expect(a.calls.map((c) => c.s)).toEqual(["1", "2", "3"]);
    expect(a.calls.map((c) => c.x)).toEqual([0, 0, 0]);
    expect(a.calls.map((c) => c.y)).toEqual([10, 30, 50]); // (row + 0.5) * 20

    // Same layout with a tiny charWidth → identical gutter (proves independence).
    const b = mkLines(20, 1);
    b.lines.draw(vp, 3);
    expect(b.calls).toEqual(a.calls);
  });
});
