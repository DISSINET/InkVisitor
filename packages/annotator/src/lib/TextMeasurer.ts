/**
 * Phase 5 (proportional text) — measurement seam + per-line prefix-width table.
 *
 * The annotator's monospace coordinate system bakes "1 char = `charWidth` px"
 * into draw and hit-test. To support proportional fonts we replace that single
 * multiply/divide with measured cumulative widths, sourced through a small
 * abstraction so the monospace path stays byte-identical (and so canvas access
 * can be mocked in tests).
 *
 * These are pure helpers — no Annotator/Text coupling. `Text` owns one prefix
 * array per visual line and converts at the draw/hit-test boundaries (P5.3/P5.4).
 */

/** Reports the rendered pixel width of a string in the current font. */
export interface TextMeasurer {
  measure(text: string): number;
}

/**
 * Legacy monospace measurer: width = char count × `charWidth`. With this
 * measurer every Phase-5 conversion reproduces the old `* charWidth` grid
 * exactly, which is what keeps the `proportional` flag's off-path identical.
 */
export class MonospaceMeasurer implements TextMeasurer {
  constructor(private readonly charWidth: number) {}

  measure(text: string): number {
    return text.length * this.charWidth;
  }
}

/**
 * Proportional measurer backed by a canvas 2D context. Caches per-string widths
 * so repeated measurement during layout stays cheap (see §6 performance notes).
 */
export class CanvasMeasurer implements TextMeasurer {
  private readonly cache = new Map<string, number>();

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly font: string
  ) {}

  measure(text: string): number {
    const cached = this.cache.get(text);
    if (cached !== undefined) {
      return cached;
    }
    this.ctx.font = this.font;
    const width = this.ctx.measureText(text).width;
    this.cache.set(text, width);
    return width;
  }

  /** Drop cached widths (e.g. on font/ratio change). */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Cumulative pixel offsets for one visual line. `prefix[c]` is the pixel x of
 * column `c`; `prefix[0] === 0` and `prefix.length === line.length + 1`.
 *
 * Built per UTF-16 CODE UNIT (additive, O(n) measure calls) so it is monotonic
 * and exact for monospace. The wrap loop ({@link additiveWidth}) uses the same
 * per-code-unit basis so line breaks agree with these offsets. Two consequences,
 * both deferred to the §5.9 (Intl.Segmenter/pretext) work: (1) within-token
 * kerning is ignored (per-char sum, not whole-string), within tolerance for the
 * proportional fonts in scope; (2) a multi-code-unit grapheme (surrogate pair,
 * combining mark) is measured in parts, matching the annotator's code-unit
 * column model — its parts' widths won't sum to the rendered grapheme width.
 */
export function buildPrefixWidths(
  line: string,
  measurer: TextMeasurer
): number[] {
  const prefix: number[] = new Array(line.length + 1);
  prefix[0] = 0;
  for (let c = 0; c < line.length; c++) {
    prefix[c + 1] = prefix[c] + measurer.measure(line[c]);
  }
  return prefix;
}

/**
 * Total width of `text` summed PER UTF-16 CODE UNIT — the exact basis
 * {@link buildPrefixWidths} uses. Wrapping must use this (not a whole-string
 * `measure(text)`) so line-break decisions agree with the prefix table's column
 * offsets; otherwise a kerned/ligated token would break at a different width
 * than its caret/selection rects are drawn (within-token kerning is ignored).
 *
 * Like buildPrefixWidths, this iterates code units, so a multi-code-unit
 * grapheme (surrogate pair, combining mark) is measured in parts — consistent
 * with the annotator's code-unit column model. Proper grapheme segmentation is
 * deferred to the §5.9 (Intl.Segmenter/pretext) work.
 */
export function additiveWidth(text: string, measurer: TextMeasurer): number {
  let width = 0;
  for (let c = 0; c < text.length; c++) {
    width += measurer.measure(text[c]);
  }
  return width;
}

/** Pixel x of column `col`, clamped into the table. */
export function columnToPixelX(prefix: number[], col: number): number {
  if (col <= 0) {
    return prefix[0] ?? 0;
  }
  if (col >= prefix.length) {
    return prefix[prefix.length - 1] ?? 0;
  }
  return prefix[col];
}

/** Pixel right edge of the line (the UPSTREAM soft-wrap caret position). */
export function pixelWidthOfLine(prefix: number[]): number {
  return prefix[prefix.length - 1] ?? 0;
}

/**
 * Inverse of {@link columnToPixelX}: pixel x → nearest column, replicating the
 * legacy `Math.floor(x / charWidth + 0.5)` 0.5 right-half bias by comparing the
 * click against the midpoint of the straddled cell.
 */
export function pixelXToColumn(prefix: number[], x: number): number {
  if (x <= 0) {
    return 0;
  }
  const last = prefix.length - 1;
  if (x >= prefix[last]) {
    return last;
  }
  // Largest column c with prefix[c] <= x, so x lands in cell [prefix[c], prefix[c+1]).
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (prefix[mid] <= x) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const c = lo;
  const midpoint = (prefix[c] + prefix[c + 1]) / 2;
  return x >= midpoint ? c + 1 : c;
}
