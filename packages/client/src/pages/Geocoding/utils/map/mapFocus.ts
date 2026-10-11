/**
 * A point the researcher asked to see on the map, and which asking it was.
 *
 * The map moves when the asking changes rather than when the point does, because
 * "take me back to that one" is a request a coordinate cannot express — asked
 * twice for the same suggestion, a coordinate is unchanged and the map would sit
 * still.
 *
 * Counted rather than timestamped. Two clicks inside the same millisecond give
 * `Date.now()` twice over, and the second would do nothing; a counter cannot
 * collide however fast anyone clicks.
 */

export interface MapFocus {
  lat: number;
  lon: number;
  /** Which asking this is. Compared, never displayed. */
  at: number;
}

export const nextFocus = (previous: MapFocus | null, lat: number, lon: number): MapFocus => ({
  lat,
  lon,
  at: (previous?.at ?? 0) + 1,
});

/**
 * Never closer than this when there is only one point to show. A coordinate is
 * worth nothing without its surroundings, and the researcher may have been
 * looking at a street.
 */
export const FOCUS_MIN_ZOOM = 11;

/**
 * How long the mark that answers a "show this on the map" stays on the map.
 *
 * Long enough to outlast the flight and be found once the map settles, short
 * enough that a ring left over from an earlier question is never read as a
 * claim about the Location now selected. Asking again replaces it, so this is
 * only what happens when nothing else is asked.
 */
export const FOCUS_MARK_MS = 6000;

/**
 * Never closer than this when fitting two. Two suggestions a hundred metres
 * apart would otherwise fit at street level, which claims a precision neither
 * the engine nor the coordinate supports.
 */
export const FIT_MAX_ZOOM = 13;

/** Room around a fitted pair, so neither sits against an edge. */
export const FIT_PADDING: [number, number] = [64, 64];

export type MapMove =
  | { fit: [[number, number], [number, number]]; maxZoom: number; padding: [number, number] }
  | { center: [number, number]; zoom: number };

/**
 * How the map should move to show a point that was asked for.
 *
 * With a coordinate already on the Location, both are fitted: the question
 * behind the control is "where is that relative to what I have", and arriving on
 * top of a place 800 km away at whatever zoom was set answers none of it.
 *
 * With nothing to compare against there is nothing to fit, so the map centres
 * and only ever moves closer - a researcher who has zoomed in to read a
 * coastline has said something about what they want to see.
 */
export const moveFor = (
  focus: { lat: number; lon: number },
  anchor: [number, number] | null,
  currentZoom: number,
): MapMove =>
  anchor
    ? {
        fit: [[focus.lat, focus.lon], anchor],
        maxZoom: FIT_MAX_ZOOM,
        padding: FIT_PADDING,
      }
    : { center: [focus.lat, focus.lon], zoom: Math.max(currentZoom, FOCUS_MIN_ZOOM) };

/**
 * Where a popup opened from a control should sit, in viewport coordinates.
 *
 * Measured from the control and placed against the bottom edge, because the
 * popup opens upward and its height is not known until it is rendered. It is
 * fixed to the viewport rather than to the list, which scrolls: opened inside
 * the list, a menu lost most of itself above the container and showed only its
 * last option — on a control that leads to a write.
 */
export const popupAnchorFor = (
  control: { left: number; top: number },
  viewportHeight: number,
): { left: number; bottom: number } => ({
  left: control.left,
  bottom: viewportHeight - control.top,
});
