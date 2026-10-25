import { IClassifiedUnder, IResponseClassifiedUnder } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useEntitiesQuery } from "hooks/react-query/useEntitiesQuery";
import { useMemo } from "react";

/**
 * Which of the project's location types each Location comes under.
 *
 * A Location has a location type by being classified under the Concept the type
 * is assigned, or under one of its subclasses or synonyms. The server walks that
 * hierarchy and says, for every classified entity, which of the assigned Concepts
 * it reaches and through which Concept; this page learns nothing of the
 * hierarchy beyond that. A project has a dozen location types, so this is one
 * request however many Locations there are.
 */

/** The query key every cached assignment lives under, for invalidating after a write. */
export const PLACE_TYPE_ASSIGNMENTS_KEY = "geocoding-place-types";

/** One location type a Location comes under, and how. */
export interface LocationTypeEntry {
  /** The project's location type. */
  typeId: string;
  /** False exactly when the Location is classified under the type's own Concept. */
  inferred: boolean;
  /** The Concept the Location is classified under, which is the type's own unless `inferred`. */
  via: string;
  /**
   * Another of the project's location types lies below this one on the same
   * classification, so the Location is better described by that one. Not shown,
   * and not offered to be added, but it still applies.
   */
  shadowed: boolean;
}

export interface PlaceTypeAssignments {
  /**
   * Entity id to its location types: those that are shown first, the Location's
   * own before the inferred, each in the order the project lists them, and then
   * the shadowed ones.
   */
  typesByLocation: Map<string, LocationTypeEntry[]>;
  /** Location type id to how many of the given Locations read as it, inferred or not. */
  countByType: Record<string, number>;
  /** Location type id to how many of those are only inferred. */
  inferredByType: Record<string, number>;
  /** Location types whose subclasses were too many to follow, so that some Locations are missing. */
  truncatedTypes: string[];
  /**
   * Location types whose Concept the answer on hand was not asked about, which is
   * what a Concept just assigned is while its answer is awaited; their counts are
   * not zero but unknown.
   */
  pendingTypes: string[];
  /** The label of each Concept a Location is only inferred to have a type through. */
  viaLabels: Record<string, string>;
  isLoading: boolean;
  /** The request failed. */
  error: unknown;
}

const EMPTY: IResponseClassifiedUnder = { entities: {}, truncated: [] };

/**
 * The entries of one entity, in the order they are shown: the entity's own
 * location types before the inferred, shadowed ones last, and within each the
 * order the project lists its location types in.
 */
export const orderedEntries = (
  placeTypes: IGeocodingPlaceType[],
  classified: IClassifiedUnder[],
): LocationTypeEntry[] => {
  const entries: LocationTypeEntry[] = [];
  for (const placeType of placeTypes) {
    for (const one of classified) {
      if (placeType.conceptId && one.concept === placeType.conceptId) {
        entries.push({
          typeId: placeType.id,
          inferred: one.inferred,
          via: one.via,
          shadowed: one.shadowed,
        });
      }
    }
  }
  const rank = (entry: LocationTypeEntry) => (entry.shadowed ? 2 : entry.inferred ? 1 : 0);
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry) - rank(b.entry) || a.index - b.index)
    .map(({ entry }) => entry);
};

export const usePlaceTypeAssignments = (
  placeTypes: IGeocodingPlaceType[],
  /** Counts only these, where given; otherwise every classified entity counts. */
  onlyLocationIds?: Set<string>,
): PlaceTypeAssignments => {
  const concepts = useMemo(
    () => Array.from(new Set(placeTypes.map((one) => one.conceptId).filter(Boolean))).sort(),
    [placeTypes],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: [PLACE_TYPE_ASSIGNMENTS_KEY, concepts],
    queryFn: async (): Promise<{ response: IResponseClassifiedUnder; asked: string[] }> => ({
      response: (await api.entitiesClassifiedUnder(concepts, { ignoreErrorToast: true })).data,
      asked: concepts,
    }),
    enabled: concepts.length > 0,
    retry: false,
    staleTime: 30_000,
    // the settings window changes the Concepts as a researcher picks them, and
    // the counts beside the rows it leaves alone should not blink out meanwhile
    placeholderData: (previous) => previous,
  });

  // the tooltip of an inferred type says which classification it comes from, and
  // the server answers with ids; the few Concepts in question are fetched once
  const viaIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values((data?.response ?? EMPTY).entities).forEach((classified) =>
      classified.forEach((one) => one.inferred && ids.add(one.via)),
    );
    return [...ids].sort();
  }, [data]);
  const { data: viaEntities } = useEntitiesQuery("geocoding-via-concepts", viaIds, {
    keepPrevious: true,
    staleTime: 60_000,
  });
  const viaLabels = useMemo(
    () => Object.fromEntries((viaEntities ?? []).map((entity) => [entity.id, entity.labels?.[0] ?? ""])),
    [viaEntities],
  );

  return useMemo(() => {
    const response = data?.response ?? EMPTY;
    const typesByLocation = new Map<string, LocationTypeEntry[]>();
    const countByType: Record<string, number> = {};
    const inferredByType: Record<string, number> = {};
    for (const placeType of placeTypes) {
      countByType[placeType.id] = 0;
      inferredByType[placeType.id] = 0;
    }

    for (const [entityId, classified] of Object.entries(response.entities)) {
      const entries = orderedEntries(placeTypes, classified);
      if (!entries.length) {
        continue;
      }
      typesByLocation.set(entityId, entries);
      if (onlyLocationIds && !onlyLocationIds.has(entityId)) {
        continue;
      }
      for (const entry of entries) {
        if (entry.shadowed) {
          continue;
        }
        countByType[entry.typeId]++;
        if (entry.inferred) {
          inferredByType[entry.typeId]++;
        }
      }
    }

    const truncatedTypes = placeTypes
      .filter((placeType) => placeType.conceptId && response.truncated.includes(placeType.conceptId))
      .map((placeType) => placeType.id);

    const pendingTypes = placeTypes
      .filter((placeType) => placeType.conceptId && !data?.asked.includes(placeType.conceptId))
      .map((placeType) => placeType.id);

    return {
      typesByLocation,
      countByType,
      inferredByType,
      truncatedTypes,
      pendingTypes,
      viaLabels,
      isLoading,
      error: error ?? null,
    };
  }, [data, placeTypes, onlyLocationIds, viaLabels, isLoading, error]);
};
