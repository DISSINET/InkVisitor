import { CITE_WITHIN_ANY } from "@inkvisitor/shared/types/geocoding";
import { EngineMatch, Suggestion } from "../../types/engine";
import { GeocodingProvenance } from "../write/geocodingWrite";

/**
 * What a written coordinate cites as its evidence.
 *
 * Its own module because a coordinate is written from several places that never
 * see each other: a card a researcher pressed, a quick geocode nobody read, a
 * choice made in the batch window. A Location coded any of these ways has to
 * cite the same records, or the provenance says how it was written rather than
 * where it came from.
 *
 * A suggestion groups every match the engine found within its grouping radius,
 * which for a church is 7.5 km and for a region 150 km. A record at the edge of
 * that group did not say the place is where the coordinate is, so a gazetteer is
 * cited only where one of its records lies within the project's citing distance
 * of the written coordinate.
 */

/** How well a source matched, best first — the engine's own primary quality signal. */
const MATCH_RANK: Record<string, number> = { exact: 0, alias: 1, fuzzy: 2, hint: 3 };
const rankOf = (match: EngineMatch) => MATCH_RANK[match.matchType] ?? MATCH_RANK.hint;

/** Great-circle distance in km, the engine's own formula, so the two never disagree on a border case. */
export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * The citing distance for one search: the largest among the gazetteer location
 * types the engine resolved it to, as the engine groups with the largest radius
 * among them, and the "none or any" distance where it resolved to none.
 */
export const citingDistanceKm = (
  citeWithinKm: Record<string, number>,
  placeTypeIds: string[] | undefined,
): number => {
  const fallback = citeWithinKm[CITE_WITHIN_ANY] ?? Infinity;
  const ids = placeTypeIds ?? [];
  return ids.length ? Math.max(...ids.map((id) => citeWithinKm[id] ?? fallback)) : fallback;
};

/**
 * The index of the match whose coordinate the suggestion carries, or -1. An
 * engine older than 0.8.0 does not say which; its coordinate is still one
 * match's own, found by equality.
 */
export const representativeIndexOf = (suggestion: Suggestion): number => {
  const index = suggestion.representativeIndex;
  if (typeof index === "number" && index >= 0 && index < suggestion.matches.length) {
    return index;
  }
  return suggestion.matches.findIndex(
    (match) => match.lat === suggestion.lat && match.lon === suggestion.lon,
  );
};

/** One match of a suggestion, and where it stands for citing. */
export interface MatchStanding {
  match: EngineMatch;
  /** Its place in the suggestion's own list. */
  index: number;
  /** From the suggestion's coordinate. */
  distanceKm: number;
  /** The match the suggestion's coordinate is taken from. */
  representative: boolean;
  /** Further from the coordinate than the citing distance. */
  beyond: boolean;
  /** The record its gazetteer is cited with: at most one per gazetteer. */
  cited: boolean;
  /** Its gazetteer has no Resource in the settings, so nothing can be cited for it. */
  unassigned: boolean;
}

/**
 * Every match of a suggestion with its standing, the coordinate's own first and
 * the rest nearest first.
 *
 * The record the coordinate is taken from is its gazetteer's citation. Every
 * other gazetteer is cited with its best-matched record within the citing
 * distance, the nearer of two equally matched; a gazetteer with none within is
 * not cited. `llm-coords` is the model's own guess, has no record to cite, and
 * is never cited; nor is a gazetteer `resources` gives no Resource, since a
 * reference has nothing to point at without one.
 */
export const standingsOf = (
  suggestion: Suggestion,
  withinKm: number,
  resources?: Record<string, string>,
): MatchStanding[] => {
  const representative = representativeIndexOf(suggestion);
  const standings: MatchStanding[] = suggestion.matches.map((match, index) => {
    const distanceKm =
      index === representative
        ? 0
        : haversineKm(suggestion.lat, suggestion.lon, match.lat, match.lon);
    return {
      match,
      index,
      distanceKm,
      representative: index === representative,
      // a distance that cannot be measured is not within
      beyond: !(distanceKm <= withinKm),
      cited: false,
      unassigned: !!resources && !resources[match.source],
    };
  });

  const citable = (standing: MatchStanding) =>
    standing.match.source !== "llm-coords" &&
    !!standing.match.sourceId &&
    !standing.beyond &&
    !standing.unassigned;
  const citation = new Map<string, MatchStanding>();
  const lead = standings[representative];
  if (lead && citable(lead)) {
    citation.set(lead.match.source, lead);
  }
  for (const standing of standings) {
    if (!citable(standing) || standing.representative) {
      continue;
    }
    const current = citation.get(standing.match.source);
    const better =
      !current ||
      (!current.representative &&
        (rankOf(standing.match) < rankOf(current.match) ||
          (rankOf(standing.match) === rankOf(current.match) &&
            standing.distanceKm < current.distanceKm)));
    if (better) {
      citation.set(standing.match.source, standing);
    }
  }
  citation.forEach((standing) => {
    standing.cited = true;
  });

  return [...standings].sort(
    (a, b) =>
      Number(b.representative) - Number(a.representative) ||
      a.distanceKm - b.distanceKm ||
      a.index - b.index,
  );
};

/** One reference per cited gazetteer, citing the record `standingsOf` chose for it. */
export const provenanceOf = (
  suggestion: Suggestion,
  withinKm: number,
  resources?: Record<string, string>,
): GeocodingProvenance[] =>
  standingsOf(suggestion, withinKm, resources)
    .filter((standing) => standing.cited)
    .map(({ match }) => ({ source: match.source, sourceId: match.sourceId as string }));
