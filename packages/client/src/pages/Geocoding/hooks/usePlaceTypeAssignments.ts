import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { useQueries } from "@tanstack/react-query";
import api from "api";
import { useMemo } from "react";

/**
 * Which of the project's kinds of place each Location has.
 *
 * A Location has a kind by being the subject of a Classification to the kind's
 * Concept, and a search of Locations does not return relations. So the question
 * is asked from the other side: one request per assigned Concept returns every
 * Classification pointing at it, which is also what the count in the settings
 * table is made of. A project has a handful of kinds, so this is a handful of
 * requests however many Locations there are.
 */

/** The query key every cached assignment lives under, for invalidating after a write. */
export const PLACE_TYPE_ASSIGNMENTS_KEY = "geocoding-place-types";

export interface PlaceTypeAssignments {
  /** Location id → ids of its kinds, in the order the kinds are listed. */
  typesByLocation: Map<string, string[]>;
  /** Kind id → how many of the given Locations are classified under it. */
  countByType: Record<string, number>;
  isLoading: boolean;
  /** A request failed — typically a role that may not read relations. */
  error: unknown;
}

export const usePlaceTypeAssignments = (
  placeTypes: IGeocodingPlaceType[],
  /** Counts only these, where given; otherwise every classified entity counts. */
  onlyLocationIds?: Set<string>,
): PlaceTypeAssignments => {
  const concepts = useMemo(
    () => Array.from(new Set(placeTypes.map((one) => one.conceptId).filter(Boolean))).sort(),
    [placeTypes],
  );

  const results = useQueries({
    queries: concepts.map((conceptId) => ({
      queryKey: [PLACE_TYPE_ASSIGNMENTS_KEY, conceptId],
      queryFn: async (): Promise<string[]> => {
        const response = await api.relationsGet(
          conceptId,
          { relationType: RelationEnums.Type.Classification },
          false,
          { ignoreErrorToast: true },
        );
        // the Concept is the second end of a Classification; the same Concept
        // classified under another one has it first and is not an instance
        return (response.data ?? [])
          .filter((relation: Relation.IRelation) => relation.entityIds[1] === conceptId)
          .map((relation: Relation.IRelation) => relation.entityIds[0]);
      },
      retry: false,
      staleTime: 30_000,
    })),
  });

  const loading = results.some((result) => result.isLoading);
  const error = results.find((result) => result.error)?.error ?? null;
  // a new array every render, so the memo below depends on what the queries hold
  const signature = results.map((result) => result.dataUpdatedAt).join(",");

  return useMemo(() => {
    const subjectsOf = new Map<string, string[]>();
    concepts.forEach((conceptId, index) => {
      subjectsOf.set(conceptId, results[index]?.data ?? []);
    });

    const typesByLocation = new Map<string, string[]>();
    const countByType: Record<string, number> = {};
    for (const placeType of placeTypes) {
      countByType[placeType.id] = 0;
      for (const locationId of subjectsOf.get(placeType.conceptId) ?? []) {
        const known = typesByLocation.get(locationId);
        if (known) {
          known.push(placeType.id);
        } else {
          typesByLocation.set(locationId, [placeType.id]);
        }
        if (!onlyLocationIds || onlyLocationIds.has(locationId)) {
          countByType[placeType.id]++;
        }
      }
    }
    return { typesByLocation, countByType, isLoading: loading, error };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts, placeTypes, onlyLocationIds, loading, error, signature]);
};
