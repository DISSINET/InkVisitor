/**
 * #2325 — two same-colour highlights that touch (no whitespace between the
 * anchors) must not fuse into one continuous block. Every BACKGROUND span
 * gives up a hair of its right edge on its final row, so the layer underneath
 * shows through as a separator; a lone span just looks flush.
 *
 * The inset applies only at the span's true end (isSpanEnd), never at soft
 * wrap edges — those would read as false anchor boundaries mid-span.
 */
import Highlighter from "./lib/Highlighter";
import Viewport from "./lib/Viewport";
import Text from "./lib/Text";
import { HighlightMode, HIGHLIGHT_SPAN_END_GAP_PX } from "./lib/constants";
import { DrawingOptions } from "./lib/Annotator";

const mkCtx = () => {
  const rects: number[][] = [];
  const ctx = {
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
  charsAtLine: 10,
  ...extra,
});

describe("background span-end gap (#2325)", () => {
  test("span-end row of a background highlight is inset by the gap", () => {
    const h = new Highlighter(1, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, true);
    expect(rects[0][2]).toBe(20 - HIGHLIGHT_SPAN_END_GAP_PX);
  });

  test("non-end (soft-wrap) row keeps its full width", () => {
    const h = new Highlighter(1, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, false);
    expect(rects[0][2]).toBe(20);
  });

  test("gap scales with the device pixel ratio", () => {
    const h = new Highlighter(2, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, true);
    expect(rects[0][2]).toBe(20 - 2 * HIGHLIGHT_SPAN_END_GAP_PX);
  });

  test("empty-line sliver (minFillWidth, #2885) is not eaten by the gap", () => {
    const h = new Highlighter(1, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 0, 0, opts({ minFillWidth: 3 }), undefined, true);
    expect(rects[0][2]).toBe(3);
  });

  test("selection (SELECT mode) is never inset", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, true);
    expect(rects[0][2]).toBe(20);
  });

  test("draw() insets only the final row of a wrapped background span", () => {
    const h = new Highlighter(1, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    const text = new Text("aaaaaaaaaabbbbbbbbbb", 10); // 2 lines of 10
    const viewport = new Viewport(0, 5);
    h.selectStart = { xLine: 0, yLine: 0 };
    h.selectEnd = { xLine: 5, yLine: 1 };
    h.draw(ctx, viewport, text, opts());
    expect(rects).toHaveLength(2);
    expect(rects[0][2]).toBe(100); // line 0: full 10 chars, no inset at the wrap
    expect(rects[1][2]).toBe(50 - HIGHLIGHT_SPAN_END_GAP_PX); // line 1: span end
  });
});
