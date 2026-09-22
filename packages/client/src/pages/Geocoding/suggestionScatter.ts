import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { Suggestion } from "./engineTypes";

/**
 * How scattered a suggestion's own matches are, and what that argues about how
 * precisely it locates the place.
 *
 * Its own module because two things read it and neither owns it: the card shows
 * the accuracy the sources argue for, and a quick geocode — which asks nobody —
 * writes it. Two copies of this rule would mean a Location coded one way by
 * hand and another way in a batch, over the same evidence.
 */

/**
 * The share of the engine's merge radius above which the matches behind one
 * suggestion are too scattered for the coordinate to be read as the place.
 *
 * A group whose spread approaches the radius is held together by the merge
 * rather than by agreement. Across four live queries of settlements (623
 * suggestions) 15 km sits at the 90th percentile and catches the cases the
 * engine is known to get wrong: a monastery group spanning 17.9 km, and Wrocław
 * at 15.8 km where the eleven sources include the airport and the football
 * stadium.
 *
 * It is a fraction rather than those 15 km because the radius is derived from
 * the place type - 7.5 km for a church, 25 km for a settlement, 150 km for a
 * region. Against a settlement this gives back the same 15 km the sample was
 * drawn from; a constant would be inert for churches, which is where a 5 km
 * scatter most clearly means two different buildings.
 */
export const SPREAD_WARNING_FRACTION = 0.6;



/**
 * What to measure a spread against where the engine has not said.
 *
 * The engine derives its radius from the place type and publishes it on the
 * final frame only, so the preview frame and any older engine leave the page
 * without one. Ten kilometres is the tighter reading: it is below every value
 * the engine uses except a church's and a fortress's, so a card judged against
 * it is flagged sooner rather than passed over in silence, and the final frame
 * corrects it a moment later.
 */
export const DEFAULT_MERGE_RADIUS_KM = 10;

/** How far apart matches may sit and still be merged into one suggestion. */
export const spreadWarningKm = (mergeRadiusKm: number | undefined) =>
  (mergeRadiusKm ?? DEFAULT_MERGE_RADIUS_KM) * SPREAD_WARNING_FRACTION;

/**
 * Spread is the median distance between the matches, so one match has nothing to
 * measure. The engine reports 0 for those, and 0 otherwise means perfect
 * agreement - two thirds of all suggestions carry a single match, and reading
 * them as unanimous is the wrong way round.
 */
export const spreadIsMeasured = (suggestion: Suggestion) => suggestion.matches.length > 1;



/**
 * Whether the matches are scattered, and which accuracy the card leads with.
 *
 * A scattered group can still be the right place, so every accuracy stays
 * available; what changes is which one the eye lands on first.
 */
export const scatterOf = (
  suggestion: Suggestion,
  mergeRadiusKm: number | undefined,
): { scattered: boolean; leadAccuracy: GeocodingAccuracy } => {
  const threshold = spreadWarningKm(mergeRadiusKm);
  const scattered = spreadIsMeasured(suggestion) && suggestion.spreadKm >= threshold;
  return {
    scattered,
    leadAccuracy: scattered ? GeocodingAccuracy.Approximate : GeocodingAccuracy.Precise,
  };
};
