/**
 * Issue #2887 — Territory (T) anchor markers.
 *
 * A Territory anchor spans a whole territory's text, so filling it as a span
 * would flood the fulltext. Instead we draw a corner bracket at each end:
 * an L-shaped corner at the start and an inverse-L at the end, framing the
 * span without covering it.
 *
 * This module is deliberately free of any Annotator/Text dependency so the
 * glyph geometry can be unit-tested against a mocked 2D context.
 */

export type AnchorMarkerKind = "start" | "end";

export interface AnchorMarkerStyle {
  /** Vertical arm length in device px. */
  armH: number;
  /** Horizontal arm length in device px. */
  armW: number;
  /** Stroke width in device px. */
  lineWidth: number;
  /** Stroke colour (Territory blue). */
  color: string;
}

/**
 * Strokes a single corner marker.
 *
 * A `start` marker is a top-left corner (`┌`: stem on the left, top arm right);
 * an `end` marker is the horizontally-mirrored bottom-right corner (`┘`: stem
 * on the right, bottom arm left). A start/end pair frames the territory span.
 * Both glyphs occupy the x-range `[xPx, xPx + armW]` — the end marker is shifted
 * right so its leftward arm never clips past the left margin, where most
 * territory boundaries sit.
 *
 * @param ctx    target 2D context (assumed already translated for scroll)
 * @param xPx    device-px x of the anchor boundary
 * @param yMidPx device-px y of the vertical centre of the target line
 * @param kind   which end of the anchor this marker represents
 * @param style  glyph geometry and colour
 */
export function drawAnchorMarker(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yMidPx: number,
  kind: AnchorMarkerKind,
  style: AnchorMarkerStyle
): void {
  const half = style.armH / 2;
  const top = yMidPx - half;
  const bottom = yMidPx + half;
  // Strokes are centred on the path, so a stem sitting exactly on the boundary
  // column (xPx == 0 at the left margin) would have half its width clipped by
  // the canvas edge and render thinner. Nudge every x right by half the stroke
  // so the leftmost stem edge lands on xPx — applied to both kinds so the start
  // (┌) and end (┘) strokes are equally sized.
  const x0 = xPx + style.lineWidth / 2;

  ctx.save();
  // Markers paint crisp at full opacity, independent of the highlight passes
  // that may have left globalAlpha / compositing in a non-default state.
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;

  ctx.beginPath();
  if (kind === "start") {
    // ┌ : vertical stem on the left at x0, top arm running right.
    ctx.moveTo(x0, top);
    ctx.lineTo(x0, bottom);
    ctx.moveTo(x0, top);
    ctx.lineTo(x0 + style.armW, top);
  } else {
    // ┘ : vertical stem on the right, bottom arm running left back to x0. The
    // glyph is shifted right by armW so its leftmost point is x0 (the boundary
    // column) — the leftward arm never crosses the left edge into negative x.
    const stemX = x0 + style.armW;
    ctx.moveTo(stemX, top);
    ctx.lineTo(stemX, bottom);
    ctx.moveTo(stemX, bottom);
    ctx.lineTo(x0, bottom);
  }
  ctx.stroke();

  ctx.restore();
}
