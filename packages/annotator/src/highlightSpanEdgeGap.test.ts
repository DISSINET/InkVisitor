/**
 * #2325 — two same-colour highlights that touch (no whitespace between the
 * anchors) must not fuse into one continuous block. Every entity span gives up
 * a hair of pixels at each of its own outer edges, so two neighbours are parted
 * by twice the gap and the layer underneath shows through as a separator; a
 * lone span just sits a hair inside its text run.
 *
 * The insets apply only at the span's true start/end (spanEdges), never at soft
 * wrap edges — those would read as false anchor boundaries mid-span.
 */
import Highlighter from "./lib/Highlighter";
import Viewport from "./lib/Viewport";
import Text from "./lib/Text";
import { HighlightMode, HIGHLIGHT_SPAN_EDGE_GAP_PX } from "./lib/constants";
import { DrawingOptions } from "./lib/Annotator";

const GAP = HIGHLIGHT_SPAN_EDGE_GAP_PX;

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

describe.each([HighlightMode.BACKGROUND, HighlightMode.UNDERLINE])(
  "entity span edge gaps in %s mode (#2325)",
  (mode) => {
    test("the span-end row gives up the gap on its right", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      h.drawLine(ctx, 0, 1, 3, opts(), undefined, { end: true });
      expect(rects[0][0]).toBe(10); // left edge untouched
      expect(rects[0][2]).toBe(20 - GAP);
    });

    test("the span-start row gives up the gap on its left", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      h.drawLine(ctx, 0, 1, 3, opts(), undefined, { start: true });
      expect(rects[0][0]).toBe(10 + GAP);
      expect(rects[0][2]).toBe(20 - GAP);
    });

    test("a single-row span gives up the gap on both sides", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      h.drawLine(ctx, 0, 1, 3, opts(), undefined, { start: true, end: true });
      expect(rects[0][0]).toBe(10 + GAP);
      expect(rects[0][2]).toBe(20 - 2 * GAP);
    });

    test("a soft-wrap row keeps its full width on both sides", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      h.drawLine(ctx, 0, 1, 3, opts(), undefined, {});
      expect(rects[0][0]).toBe(10);
      expect(rects[0][2]).toBe(20);
    });

    test("the gap scales with the device pixel ratio", () => {
      const h = new Highlighter(2, undefined, mode);
      const { ctx, rects } = mkCtx();
      h.drawLine(ctx, 0, 1, 3, opts(), undefined, { start: true, end: true });
      expect(rects[0][0]).toBe(10 + 2 * GAP);
      expect(rects[0][2]).toBe(20 - 4 * GAP);
    });

    test("a span too narrow to carry both gaps is left alone", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      // charWidth 2 → a one-column span is 2px wide, the width of both gaps.
      h.drawLine(
        ctx,
        0,
        1,
        2,
        opts({ charWidth: 2 * GAP }),
        undefined,
        { start: true, end: true }
      );
      expect(rects[0][0]).toBe(2 * GAP);
      expect(rects[0][2]).toBe(2 * GAP);
    });

    test("draw() insets only the outer edges of a wrapped span", () => {
      const h = new Highlighter(1, undefined, mode);
      const { ctx, rects } = mkCtx();
      const text = new Text("aaaaaaaaaabbbbbbbbbb", 10); // 2 lines of 10
      const viewport = new Viewport(0, 5);
      h.selectStart = { xLine: 2, yLine: 0 };
      h.selectEnd = { xLine: 5, yLine: 1 };
      h.draw(ctx, viewport, text, opts());
      expect(rects).toHaveLength(2);
      // line 0: span start on the left, soft wrap on the right
      expect(rects[0][0]).toBe(20 + GAP);
      expect(rects[0][2]).toBe(80 - GAP);
      // line 1: soft wrap on the left, span end on the right
      expect(rects[1][0]).toBe(0);
      expect(rects[1][2]).toBe(50 - GAP);
    });
  }
);

describe("entity span edge gaps — other modes (#2325)", () => {
  test("the empty-line sliver (minFillWidth, #2885) is not eaten by the gaps", () => {
    const h = new Highlighter(1, undefined, HighlightMode.BACKGROUND);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 0, 0, opts({ minFillWidth: 3 }), undefined, {
      start: true,
      end: true,
    });
    expect(rects[0][0]).toBe(0);
    expect(rects[0][2]).toBe(3);
  });

  test("a selection (SELECT mode) is never inset", () => {
    const h = new Highlighter(1, undefined, HighlightMode.SELECT);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, { start: true, end: true });
    expect(rects[0][0]).toBe(10);
    expect(rects[0][2]).toBe(20);
  });

  test("the focus veil (FOCUS mode) is never inset", () => {
    const h = new Highlighter(1, undefined, HighlightMode.FOCUS);
    const { ctx, rects } = mkCtx();
    h.drawLine(ctx, 0, 1, 3, opts(), undefined, { start: true, end: true });
    expect(rects[0][0]).toBe(10);
    expect(rects[0][2]).toBe(20);
  });
});
