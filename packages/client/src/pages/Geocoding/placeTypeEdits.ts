import { GeocodingPlaceType, IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";

/**
 * The edits the settings table makes to the project's list of kinds, pure so the
 * rules can be tested without rendering the table.
 */

/**
 * Assigns a Concept to a kind, or unlinks it where null.
 *
 * A Concept that another kind already holds moves: it stands for one kind,
 * because a Location classified under it would otherwise be two kinds at once
 * and the count beside each would claim the same Locations.
 */
export const assignConcept = (
  kinds: IGeocodingPlaceType[],
  id: string,
  conceptId: string | null,
): IGeocodingPlaceType[] =>
  kinds.map((one) => {
    if (one.id === id) {
      return { ...one, conceptId: conceptId ?? "" };
    }
    return conceptId && one.conceptId === conceptId ? { ...one, conceptId: "" } : one;
  });

/**
 * Pairs a kind with an engine type, or with none.
 *
 * The first kind to answer to an engine type becomes its favourite, because a
 * suggestion with that type must have something to offer first; one that joins
 * a type already led by another is not, so pairing never takes the star away.
 */
export const pairEngineType = (
  kinds: IGeocodingPlaceType[],
  id: string,
  engineType: GeocodingPlaceType | null,
): IGeocodingPlaceType[] =>
  kinds.map((one) => {
    if (one.id !== id) {
      return one;
    }
    const led =
      !!engineType &&
      kinds.some((other) => other.id !== id && other.engineType === engineType && other.favorite);
    return { ...one, engineType, favorite: !!engineType && !led };
  });

/** Makes a kind the favourite for its engine type, taking the star from the one that had it. */
export const makeFavorite = (
  kinds: IGeocodingPlaceType[],
  id: string,
): IGeocodingPlaceType[] => {
  const chosen = kinds.find((one) => one.id === id);
  if (!chosen?.engineType) {
    return kinds;
  }
  return kinds.map((one) => {
    if (one.id === id) {
      return { ...one, favorite: true };
    }
    return one.engineType === chosen.engineType ? { ...one, favorite: false } : one;
  });
};

/** Which of the project's kinds a suggestion's engine type points at, the favourite first. */
export const kindsForEngineType = (
  kinds: IGeocodingPlaceType[],
  engineType: string | null | undefined,
): IGeocodingPlaceType[] => {
  if (!engineType) {
    return [];
  }
  const answering = kinds.filter((one) => one.engineType === engineType);
  return [...answering.filter((one) => one.favorite), ...answering.filter((one) => !one.favorite)];
};
