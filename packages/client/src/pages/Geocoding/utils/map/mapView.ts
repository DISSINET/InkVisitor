import { Position } from "./geocodingMapLayers";

/** Constants and helpers for how the map moves and where its pickers open. */

export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_LIMIT = 6;
export const EUROPE: Position = [48, 12];

/** Long enough to read as travel rather than as a jump, short enough to wait for. */
export const FLY_SECONDS = 0.7;

/** How many of the strongest suggestions the map fits when a run finishes. */
export const FLY_TO_SUGGESTIONS = 5;

/** Room around a fitted set, so no suggestion sits against an edge. */
export const FIT_PADDING = 64;

/** How long fitting the strongest suggestions of a finished run takes to settle. */
export const FIT_SUGGESTIONS_MS = 800;

/**
 * Zoom levels here are one lower than the same scale in `mapFocus`.
 *
 * That module states its levels against 256px tiles; this renderer counts
 * against 512px ones. Converting at the boundary keeps those constants stated in
 * the units their own reasoning is written in — "never closer than a street" is
 * a claim about scale, and it is checked by tests that name the number.
 */
export const ZOOM_SHIFT = 1;
export const toMapZoom = (zoom: number) => zoom - ZOOM_SHIFT;
export const fromMapZoom = (zoom: number) => zoom + ZOOM_SHIFT;

/**
 * Where a picker opens for a coordinate picked on the map.
 *
 * The pending point is measured inside the map element and the pickers are
 * placed against the viewport, so the container's own position is the
 * difference between the two.
 */
export const pickerAnchorIn = (
  container: HTMLElement | null,
  pending: { x: number; y: number },
): { left: number; top: number; bottom: number } => {
  const box = container?.getBoundingClientRect();
  const left = (box?.left ?? 0) + pending.x;
  const top = (box?.top ?? 0) + pending.y;
  return { left, top, bottom: top };
};
