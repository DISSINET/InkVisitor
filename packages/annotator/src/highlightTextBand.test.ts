/**
 * Highlights that wrap text — the selection band, the collapsed caret, the
 * anchor background fill and the statement underline — are placed against the
 * band the letters occupy, not against the line box. The letters keep their
 * size when the line spacing changes, so these keep theirs too, and they follow
 * the letters upward off the line centre (text is painted against the em box,
 * whose descender room a capital leaves empty).
 */
import Highlighter from "./lib/Highlighter";
import {
  HighlightMode,
  HIGHLIGHT_HEIGHT_RATIO,
  UNDERLINE_OFFSET_PX,
} from "./lib/constants";
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

// [x, y, w, h] of the single rect drawn for one line of a highlight.
const draw = (
  mode: HighlightMode,
  o: DrawingOptions,
  caret = false
): number[] => {
  const h = new Highlighter(1, undefined, mode);
  const { ctx, rects } = mkCtx();
  h.drawLine(ctx, 0, 1, caret ? 1 : 3, o, undefined, {});
  return rects[0];
};

describe.each([HighlightMode.BACKGROUND, HighlightMode.SELECT])(
  "%s band placement",
  (mode) => {
    test("the height is the measured text band, whatever the line spacing", () => {
      const tight = draw(mode, opts({ lineHeight: 20, textBandHeight: 16 }));
      const loose = draw(mode, opts({ lineHeight: 60, textBandHeight: 16 }));
      expect(tight[3]).toBe(16);
      expect(loose[3]).toBe(16);
    });

    test("a band taller than its line is trimmed to the line", () => {
      expect(draw(mode, opts({ lineHeight: 20, textBandHeight: 30 }))[3]).toBe(
        20
      );
    });

    test("without a measured band it falls back to a share of the line", () => {
      expect(draw(mode, opts({ lineHeight: 20 }))[3]).toBe(
        20 * HIGHLIGHT_HEIGHT_RATIO
      );
    });

    test("the band follows the letters off the line centre", () => {
      const centred = draw(mode, opts({ textBandHeight: 16 }));
      const shifted = draw(
        mode,
        opts({ textBandHeight: 16, textBandOffset: -3 })
      );
      expect(centred[1]).toBe((20 - 16) / 2);
      expect(shifted[1]).toBe(centred[1] - 3);
    });
  }
);

describe("collapsed caret", () => {
  test("keeps the band height at any line spacing", () => {
    const tight = draw(
      HighlightMode.SELECT,
      opts({ lineHeight: 20, textBandHeight: 16, caretWidth: 2 }),
      true
    );
    const loose = draw(
      HighlightMode.SELECT,
      opts({ lineHeight: 60, textBandHeight: 16, caretWidth: 2 }),
      true
    );
    expect(tight[2]).toBe(2); // the caret, not a span
    expect(tight[3]).toBe(16);
    expect(loose[3]).toBe(16);
  });
});

describe("statement underline placement", () => {
  test("hangs under the text band, not at the bottom of the line", () => {
    const bar = draw(
      HighlightMode.UNDERLINE,
      opts({ lineHeight: 60, textBandHeight: 16 })
    );
    const bandBottom = (60 - 16) / 2 + 16;
    expect(bar[1]).toBe(bandBottom + UNDERLINE_OFFSET_PX);
  });

  test("follows the letters off the line centre", () => {
    const bar = draw(
      HighlightMode.UNDERLINE,
      opts({ lineHeight: 60, textBandHeight: 16, textBandOffset: -4 })
    );
    const bandBottom = (60 - 16) / 2 - 4 + 16;
    expect(bar[1]).toBe(bandBottom + UNDERLINE_OFFSET_PX);
  });

  test("stays inside its own line when the spacing is tight", () => {
    const lineHeight = 18;
    const bar = draw(
      HighlightMode.UNDERLINE,
      opts({ lineHeight, textBandHeight: lineHeight })
    );
    expect(bar[1] + bar[3]).toBeLessThanOrEqual(lineHeight);
  });
});
