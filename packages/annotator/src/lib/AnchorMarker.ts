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
 * The vertical arm is centred on `yMidPx` and spans `armH`. Both arms run
 * right: a `start` marker caps the top (`┌`) and an `end` marker caps the
 * bottom (`└`), so a start/end pair reads as a vertical bracket around the
 * territory. Rightward arms never clip at the left margin, where most
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

  ctx.save();
  // Markers paint crisp at full opacity, independent of the highlight passes
  // that may have left globalAlpha / compositing in a non-default state.
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;

  ctx.beginPath();
  // Vertical arm (shared by both kinds).
  ctx.moveTo(xPx, top);
  ctx.lineTo(xPx, bottom);
  if (kind === "start") {
    // Top arm, running right → ┌
    ctx.moveTo(xPx, top);
    ctx.lineTo(xPx + style.armW, top);
  } else {
    // Bottom arm, running right → └
    ctx.moveTo(xPx, bottom);
    ctx.lineTo(xPx + style.armW, bottom);
  }
  ctx.stroke();

  ctx.restore();
}
