import { Suggestion } from "./engineTypes";
import { GeocodingProvenance } from "./geocodingWrite";

/**
 * What a written coordinate cites as its evidence.
 *
 * Its own module because a coordinate is written from two places that never see
 * each other: a card a researcher pressed, and a quick geocode nobody read. A
 * Location coded either way has to cite the same records, or the provenance says
 * how it was written rather than where it came from.
 */

/** How well a source matched, best first — the engine's own primary quality signal. */
const MATCH_RANK: Record<string, number> = { exact: 0, alias: 1, fuzzy: 2, hint: 3 };

/**
 * One reference per contributing source, citing that source's best match.
 *
 * A suggestion groups every match that landed on the same place, and one source
 * can contribute several — GeoNames returned eight for Wrocław, including its
 * airport and its football stadium. Citing all of them records the airport as
 * evidence for the town. Citing the best one records what the source actually
 * said this place is.
 *
 * `llm-coords` is the model's own coordinate guess, has no record to cite, and
 * is skipped entirely.
 */

export const provenanceOf = (suggestion: Suggestion): GeocodingProvenance[] => {
  const best = new Map<string, { sourceId: string; rank: number }>();
  for (const match of suggestion.matches) {
    if (match.source === "llm-coords" || !match.sourceId) {
      continue;
    }
    const rank = MATCH_RANK[match.matchType] ?? MATCH_RANK.hint;
    const current = best.get(match.source);
    if (!current || rank < current.rank) {
      best.set(match.source, { sourceId: match.sourceId, rank });
    }
  }
  return [...best.entries()].map(([source, { sourceId }]) => ({ source, sourceId }));
};
