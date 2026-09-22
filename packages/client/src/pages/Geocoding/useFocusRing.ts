import { useEffect, useState } from "react";
import { FOCUS_MARK_MS, MapFocus } from "./mapFocus";
import { Position } from "./geocodingMapLayers";

/** A ring that is up, and when it went up. */
export interface FocusRing {
  at: Position;
  /** Wall clock, so how far through its life it is can be read at any frame. */
  since: number;
}

/**
 * The point a "show this on the map" pointed at, while its ring is up.
 *
 * Held apart from the focus itself because the two answer different questions:
 * a focus is where the map was sent and is spent as soon as it has moved, while
 * this is what is drawn, which outlives the flight and then stops. One point at
 * a time, so asking again replaces the ring rather than adding to it.
 *
 * The cleanup is what makes that replacement work: the timer taking a ring down
 * is cancelled along with the ring it belonged to, so a timer started for an
 * earlier asking can never fire over a later one.
 */
export const useFocusRing = (focus: MapFocus | null): FocusRing | null => {
  const [ringed, setRinged] = useState<FocusRing | null>(null);
  useEffect(() => {
    if (!focus) {
      return;
    }
    setRinged({ at: [focus.lat, focus.lon], since: Date.now() });
    const timer = window.setTimeout(() => setRinged(null), FOCUS_MARK_MS);
    return () => window.clearTimeout(timer);
    // asking twice for the same point is a request to see it again, which the
    // coordinate alone cannot express — only the count of askings changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.at]);
  return ringed;
};
