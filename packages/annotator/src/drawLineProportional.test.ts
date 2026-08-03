/**
 * Proportional text — caret/rect x via the prefix table.
 *
 * `Highlighter.drawLine` is the single chokepoint that turns column ranges into
 * pixel rects (caret, selection, highlight). Monospace stays `col * charWidth`;
 * when a `columnToPixelX` resolver + absolute line are supplied it uses measured
 * widths instead. Conversions are keyed by the ABSOLUTE visual line.
 */
import Highlighter from "./lib/Highlighter";
import { HighlightMode } from "./lib/constants";
import { DrawingOptions } from "./lib/Annotator";

const mkCtx = () => {
  const rects: number[][] = [];
  const ctx = {
    // Wide enough that the caret edge pin never engages in these tests.
    canvas: { width: 10000 },
    fillRect: (x: number, y: number, w: number, h: number) =>
      rects.push([x, y, w, h]),
    fillStyle: "",
    globalAlpha: 1,
    globalCompositeOperation: "",
  } as unknown as CanvasRenderingContext2D;
  return { ctx, rects };
};

const opts = (extra: Partial<DrawingOptions> = {}): DrawingOptions => ({
  charWidth: 10,
  lineHeight: 20,
  charsAtLine: 80,
  ...extra,
});

describe("Highlighter.drawLine column→pixel", () => {
  test("monospace path multiplies columns by charWidth (flag off, unchanged)", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts());
    expect(rects[0][0]).toBe(10); // xStart 1 * 10
    expect(rects[0][2]).toBe(20); // width (3-1) * 10
  });

  test("proportional path uses the resolver with the absolute line", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    const prefix = [0, 10, 30, 40]; // absLine 5
    const columnToPixelX = (absLine: number, col: number) => {
      expect(absLine).toBe(5);
      return prefix[col];
    };
    h.drawLine(ctx, 0, 1, 3, opts({ charWidth: 999, columnToPixelX }), 5);
    expect(rects[0][0]).toBe(10); // col 1 -> 10
    expect(rects[0][2]).toBe(30); // width = prefix[3] - prefix[1] = 40 - 10
  });

  test("collapsed caret uses measured x and falls back to caretWidth", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    const prefix = [0, 10, 30, 40];
    const columnToPixelX = (_absLine: number, col: number) => prefix[col];
    h.drawLine(ctx, 0, 2, 2, opts({ charWidth: 999, caretWidth: 2, columnToPixelX }), 7);
    expect(rects[0][0]).toBe(30); // col 2 -> 30
    expect(rects[0][2]).toBe(2); // width 0 -> caretWidth
  });

  test("falls back to monospace when a resolver is set but absLine is omitted", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    const columnToPixelX = () => 999;
    h.drawLine(ctx, 0, 1, 2, opts({ columnToPixelX })); // no absLine arg
    expect(rects[0][0]).toBe(10); // 1 * charWidth(10), resolver ignored
  });
});
