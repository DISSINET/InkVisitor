import { GeocodingAccuracy, GeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";

/**
 * The two questions a coordinate set by hand has to answer, and where the menu
 * that asks them goes.
 *
 * Separated from the map because the branch that matters - whether the second
 * question is asked at all - depends on a preference, and a map is the one place
 * that cannot be exercised without a browser.
 */

/** A coordinate picked on the map, part-way through being written. */
export interface MapPending {
  lat: number;
  lon: number;
  /** Where the menu sits, in the map container's own coordinates. */
  x: number;
  y: number;
  /** Set once the accuracy is chosen, which is what moves the menu to its second question. */
  accuracy?: GeocodingAccuracy;
  /**
   * The suggestion this coordinate is, where it is one rather than a point
   * picked off the basemap.
   *
   * The two are the same two questions asked over the same map, and differ only
   * in what the answers are reported as: accepting a suggestion owes the engine
   * feedback about which of its answers was taken, and a bare coordinate owes it
   * nothing. Carried through the steps so the last of them still knows.
   */
  suggestion?: { index: number; label: string };
}

export type MapAssignStep =
  | { write: { accuracy: GeocodingAccuracy; placeType?: GeocodingPlaceType | null } }
  | { ask: MapPending };

/**
 * What choosing an accuracy leads to: the second question, or the write.
 *
 * A project that records no place type has nothing to ask, and asking anyway
 * would put a step in front of every map click that can only be dismissed.
 *
 * Not asking is not the same as having no answer. Where one kind has been named
 * to stand for the whole corpus, that kind is written — the question is settled
 * once rather than left open, which is what the setting is for. Without one the
 * write carries no kind at all and each Location keeps whatever it had.
 */
export const afterAccuracy = (
  pending: MapPending,
  accuracy: GeocodingAccuracy,
  recordPlaceType: boolean | undefined,
  defaultPlaceType?: GeocodingPlaceType | null,
): MapAssignStep =>
  recordPlaceType === false
    ? { write: defaultPlaceType ? { accuracy, placeType: defaultPlaceType } : { accuracy } }
    : { ask: { ...pending, accuracy } };

/**
 * Where to put the menu for a coordinate typed into the fields rather than
 * clicked on the map.
 *
 * Above the fields and aligned to their left edge, in the container's
 * coordinates, because the menu is positioned within the map and the rectangles
 * are measured against the viewport.
 */
export const MANUAL_MENU_LIFT = 260;

export const menuAnchorFor = (
  form: { left: number; top: number },
  container: { left: number; top: number } | undefined,
): { x: number; y: number } => ({
  x: form.left - (container?.left ?? 0),
  y: form.top - (container?.top ?? 0) - MANUAL_MENU_LIFT,
});
