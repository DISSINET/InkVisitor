/**
 * Proportional text hit-test.
 *
 * setPositionFromCanvasOffsets maps a canvas click to a caret column. Monospace
 * keeps the legacy `xToCharI` (x / charWidth). Proportional resolves the column
 * via a pixelXToColumn(absLine, deviceX) resolver keyed by the clicked line —
 * so it must compute yLine FIRST, and scale offsetX from CSS px to device px
 * (× ratio), matching the prefix table's device-px space.
 */
import Cursor from "./lib/Cursor";

describe("setPositionFromCanvasOffsets hit-test", () => {
  test("monospace path is unchanged (xToCharI)", () => {
    const c = new Cursor(1, 0, 0); // ratio 1
    // floor(25 / 10 * 1 + 0.5) = floor(3.0) = 3
    c.setPositionFromCanvasOffsets(25, 0, 20, 10, 0, 0);
    expect(c.xLine).toBe(3);
    expect(c.yLine).toBe(0);
  });

  test("monospace applies ratio to offsetX (bitmap mapping)", () => {
    const c = new Cursor(2, 0, 0); // ratio 2
    // floor(25 / 10 * 2 + 0.5) = floor(5.5) = 5
    c.setPositionFromCanvasOffsets(25, 0, 20, 10, 0, 0);
    expect(c.xLine).toBe(5);
  });

  test("proportional uses the resolver with (yLine, offsetX*ratio) and computes yLine first", () => {
    const c = new Cursor(2, 0, 0); // ratio 2
    let seen: { absLine: number; deviceX: number } | undefined;
    const pixelXToColumn = (absLine: number, deviceX: number) => {
      seen = { absLine, deviceX };
      return 7;
    };
    // relY = floor((30*2 + 0) / 20) = 3; yLine = viewportLineStart(5) + 3 = 8
    c.setPositionFromCanvasOffsets(11, 30, 20, 999, 0, 5, pixelXToColumn);
    expect(seen).toEqual({ absLine: 8, deviceX: 22 }); // offsetX 11 * ratio 2
    expect(c.xLine).toBe(7); // resolver result used (charWidth 999 ignored)
    expect(c.yLine).toBe(8);
  });

  test("proportional clamps a negative offsetX to device x 0", () => {
    const c = new Cursor(1, 0, 0);
    let seenX: number | undefined;
    const pixelXToColumn = (_absLine: number, deviceX: number) => {
      seenX = deviceX;
      return 0;
    };
    c.setPositionFromCanvasOffsets(-50, 0, 20, 10, 0, 0, pixelXToColumn);
    expect(seenX).toBe(0);
  });
});
