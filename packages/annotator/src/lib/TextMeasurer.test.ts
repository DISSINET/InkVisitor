/**
 * Proportional text unit tests.
 *
 * The measurement seam and the per-line prefix-width table are the foundation
 * proportional layout plugs into. These are pure units (no canvas, no Annotator)
 * so they are exhaustively testable with a deterministic mock measurer.
 */
import {
  MonospaceMeasurer,
  CanvasMeasurer,
  buildPrefixWidths,
  additiveWidth,
  columnToPixelX,
  pixelXToColumn,
  pixelWidthOfLine,
  TextMeasurer,
} from "./TextMeasurer";

// Deterministic proportional measurer: 'W' is wide (20), everything else 10.
// Width is the sum of per-char widths so it stays additive/monotonic.
const proportional = (wide = 20, narrow = 10): TextMeasurer => ({
  measure: (text: string) =>
    [...text].reduce((acc, ch) => acc + (ch === "W" ? wide : narrow), 0),
});

describe("MonospaceMeasurer", () => {
  test("measures width as character count times charWidth", () => {
    const m = new MonospaceMeasurer(7);
    expect(m.measure("abc")).toBe(21);
  });

  test("measures the empty string as zero", () => {
    expect(new MonospaceMeasurer(7).measure("")).toBe(0);
  });
});

describe("CanvasMeasurer", () => {
  const mkCtx = () => {
    const calls: string[] = [];
    const ctx = {
      font: "",
      measureText: (t: string) => {
        calls.push(t);
        return { width: t.length * 11 } as TextMetrics;
      },
    } as unknown as CanvasRenderingContext2D;
    return { ctx, calls };
  };

  test("delegates to ctx.measureText after setting the font", () => {
    const { ctx } = mkCtx();
    const m = new CanvasMeasurer(ctx, "13px Foo");
    expect(m.measure("abcd")).toBe(44);
    expect(ctx.font).toBe("13px Foo");
  });

  test("caches repeated measurements of the same string", () => {
    const { ctx, calls } = mkCtx();
    const m = new CanvasMeasurer(ctx, "13px Foo");
    m.measure("hello");
    m.measure("hello");
    expect(calls).toEqual(["hello"]);
  });

  test("clearCache forces re-measurement", () => {
    const { ctx, calls } = mkCtx();
    const m = new CanvasMeasurer(ctx, "13px Foo");
    m.measure("hi");
    m.clearCache();
    m.measure("hi");
    expect(calls).toEqual(["hi", "hi"]);
  });
});

describe("additiveWidth (wrap budget shares the prefix-table basis)", () => {
  test("sums per-character widths", () => {
    expect(additiveWidth("aWb", proportional())).toBe(40);
    expect(additiveWidth("", proportional())).toBe(0);
  });

  test("uses the per-character basis, not whole-string kerning/ligatures", () => {
    // 'ff' measured as a whole is a 15px ligature, but per-char it's 20px.
    const kerning: TextMeasurer = {
      measure: (t) => (t === "ff" ? 15 : [...t].length * 10),
    };
    expect(additiveWidth("ff", kerning)).toBe(20);
    // ...and it equals the prefix table's line width, so wrap and draw agree.
    expect(additiveWidth("ff", kerning)).toBe(
      pixelWidthOfLine(buildPrefixWidths("ff", kerning))
    );
  });
});

describe("buildPrefixWidths", () => {
  test("monospace prefix is c * charWidth and matches the legacy grid exactly", () => {
    const prefix = buildPrefixWidths("abc", new MonospaceMeasurer(10));
    expect(prefix).toEqual([0, 10, 20, 30]);
  });

  test("empty line yields a single zero entry", () => {
    expect(buildPrefixWidths("", new MonospaceMeasurer(10))).toEqual([0]);
  });

  test("proportional prefix accumulates per-char widths monotonically", () => {
    // "aWb" -> widths 10, 20, 10 -> prefix 0,10,30,40
    expect(buildPrefixWidths("aWb", proportional())).toEqual([0, 10, 30, 40]);
  });
});

describe("columnToPixelX", () => {
  const prefix = [0, 10, 30, 40]; // "aWb" proportional

  test("returns the prefix entry for an in-range column", () => {
    expect(columnToPixelX(prefix, 0)).toBe(0);
    expect(columnToPixelX(prefix, 1)).toBe(10);
    expect(columnToPixelX(prefix, 2)).toBe(30);
    expect(columnToPixelX(prefix, 3)).toBe(40);
  });

  test("clamps columns outside the table to the edges", () => {
    expect(columnToPixelX(prefix, -5)).toBe(0);
    expect(columnToPixelX(prefix, 99)).toBe(40);
  });
});

describe("pixelWidthOfLine", () => {
  test("returns the last prefix entry (line's pixel right edge)", () => {
    expect(pixelWidthOfLine([0, 10, 30, 40])).toBe(40);
  });

  test("empty line has zero width", () => {
    expect(pixelWidthOfLine([0])).toBe(0);
  });
});

describe("pixelXToColumn (midpoint bias replicates Math.floor(x/charWidth + 0.5))", () => {
  const mono = [0, 10, 20, 30]; // charWidth 10

  test.each([
    [0, 0],
    [4, 0],
    [5, 1], // exactly at midpoint of cell 0 -> rounds up
    [14, 1],
    [15, 2], // midpoint of cell 1
    [16, 2],
    [25, 3], // midpoint of cell 2
    [24, 2],
    [30, 3], // right edge
  ])("monospace x=%i resolves to column %i", (x, col) => {
    expect(pixelXToColumn(mono, x)).toBe(col);
    // must match the legacy hit-test formula exactly
    expect(pixelXToColumn(mono, x)).toBe(Math.floor(x / 10 + 0.5));
  });

  test("clamps a click past the right edge to the last column", () => {
    expect(pixelXToColumn(mono, 999)).toBe(3);
  });

  test("clamps a negative click to column 0", () => {
    expect(pixelXToColumn(mono, -10)).toBe(0);
  });

  test("proportional: clicking the right half of a wide glyph selects the next column", () => {
    const prefix = [0, 10, 30, 40]; // "aWb"; the wide cell spans [10,30], midpoint 20
    expect(pixelXToColumn(prefix, 19)).toBe(1); // left half of 'W'
    expect(pixelXToColumn(prefix, 20)).toBe(2); // midpoint -> next column
    expect(pixelXToColumn(prefix, 21)).toBe(2); // right half of 'W'
  });
});

describe("columnToPixelX ↔ pixelXToColumn round-trip (the hit-test⇄draw invariant)", () => {
  // Clicking exactly where a caret/column is DRAWN must resolve back to that
  // column — this is what lets the proportional flag be enabled without the
  // caret landing off its drawn position. Covers uniform + wide-glyph layouts.
  test.each([
    [[0, 10, 20, 30], "monospace"],
    [[0, 10, 30, 40], "wide glyph"],
    [[0, 7, 12, 33, 40], "mixed widths"],
  ])("draw->click returns the same column (%s)", (prefix) => {
    for (let col = 0; col < prefix.length; col++) {
      expect(pixelXToColumn(prefix, columnToPixelX(prefix, col))).toBe(col);
    }
  });
});
