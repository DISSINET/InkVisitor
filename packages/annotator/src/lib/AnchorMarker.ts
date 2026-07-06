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

/** Axis-aligned bounding box of a drawn marker (device px). */
export interface AnchorMarkerBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Strokes a single corner marker and returns the box it occupied (so the caller
 * can build a matching hover hit target).
 *
 * A `start` marker is a top-left corner (`┌`: stem at the boundary, top arm
 * running right into the content). An `end` marker is the mirrored bottom-right
 * corner (`┘`: stem at the boundary, bottom arm running left over the content).
 * Both arms point inward, framing the span — and neither sits over the text that
 * follows the anchor.
 *
 * Left-margin safety: strokes are centred on the path, so a stem on the boundary
 * column (`xPx == 0`) would be half-clipped by the canvas edge. The `start` stem
 * is nudged right by half the stroke; the `end` glyph's leftmost point is
 * clamped to that same inset, so its leftward arm never crosses into negative x.
 *
 * @param ctx    target 2D context (assumed already translated for scroll)
 * @param xPx    device-px x of the anchor boundary
 * @param yMidPx device-px y of the vertical centre of the target line
 * @param kind   which end of the anchor this marker represents
 * @param style  glyph geometry and colour
 * @returns the device-px bounding box of the strokes drawn
 */
export function drawAnchorMarker(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yMidPx: number,
  kind: AnchorMarkerKind,
  style: AnchorMarkerStyle
): AnchorMarkerBox {
  const half = style.armH / 2;
  const inset = style.lineWidth / 2;

  // Snap a stroke centre to the device-pixel grid so its edges land on whole
  // pixels instead of straddling two columns/rows (which the canvas renders as
  // a soft, "pixelated"-looking antialiased smear). A stroke of width w centred
  // at c covers [c - w/2, c + w/2]; we want that lower edge on an integer.
  const snap = (center: number): number =>
    Math.round(center - inset) + inset;

  const top = snap(yMidPx - half);
  const bottom = snap(yMidPx + half);

  ctx.save();
  // Markers paint crisp at full opacity, independent of the highlight passes
  // that may have left globalAlpha / compositing in a non-default state.
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  // A single continuous polyline per glyph: the stem and arm share one mitered
  // corner instead of being two separately-capped subpaths whose ends overlap
  // into a ragged notch. `butt` caps keep the free ends flush to the box.
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";

  let leftX: number;
  ctx.beginPath();
  if (kind === "start") {
    // ┌ : stem at the boundary (inset off the edge), top arm running right.
    const stemX = snap(xPx + inset);
    leftX = stemX;
    // bottom of stem → corner → right end of arm, in one stroke.
    ctx.moveTo(stemX, bottom);
    ctx.lineTo(stemX, top);
    ctx.lineTo(stemX + style.armW, top);
  } else {
    // ┘ : stem at the boundary, bottom arm running left over the content. The
    // leftmost point is clamped to `inset` so at the left margin the whole
    // glyph shifts right just enough to stay on-screen.
    leftX = Math.max(xPx - style.armW, inset);
    const stemX = snap(leftX + style.armW);
    // top of stem → corner → left end of arm, in one stroke.
    ctx.moveTo(stemX, top);
    ctx.lineTo(stemX, bottom);
    ctx.lineTo(leftX, bottom);
  }
  ctx.stroke();

  ctx.restore();

  return { x: leftX, y: top, w: style.armW, h: style.armH };
}
