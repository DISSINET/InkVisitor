import { IResponseClassifiedUnder, IResponseEntity } from "@inkvisitor/shared/types";
import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useEntitiesQuery } from "hooks/react-query/useEntitiesQuery";
import { useMemo } from "react";
import {
  LocationTypeEntry,
  PlaceTypeNode,
  TypeConcept,
  deriveTypeEntries,
  entryApplies,
  expandPlaceTypes,
  rootsOf,
} from "../utils/context/placeTypeHierarchy";

export type { LocationTypeEntry } from "../utils/context/placeTypeHierarchy";

/**
 * Which of the project's location types each Location comes under.
 *
 * A location type is a Concept and every Concept of its subclass tree. The
 * server walks each tree once and says, for every classified entity, which of
 * the location types' own Concepts it comes under, and every Concept of the
 * trees it is classified under; the page places it in the tree from that. A
 * project has a dozen location types, so this is one request however many
 * Locations and subclasses there are.
 */

/** The query key every cached assignment lives under, for invalidating after a write. */
export const PLACE_TYPE_ASSIGNMENTS_KEY = "geocoding-place-types";

export interface PlaceTypeAssignments {
  /** Every location type with its tree, roots in the order the settings list them. */
  nodes: PlaceTypeNode[];
  /** The Concepts of the location types and their trees, by id, as far as they are loaded. */
  conceptEntities: Record<string, IResponseEntity>;
  /**
   * Entity id to its location types: those that are shown first, the Location's
   * own before the inferred, each in the order the location types are listed, and
   * then those not shown.
   */
  typesByLocation: Map<string, LocationTypeEntry[]>;
  /** Location type id to how many of the given Locations come under it, at it or below. */
  countByType: Record<string, number>;
  /** Location type id to how many of those are classified under a subclass or a synonym of its Concept. */
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

const EMPTY: IResponseClassifiedUnder = {
  entities: {},
  truncated: [],
  trees: {},
  classifiedAs: {},
};

export const usePlaceTypeAssignments = (
  /** The location types as the settings hold them; a list with their trees in it reads the same. */
  placeTypes: IGeocodingPlaceType[],
  /** Counts only these, where given; otherwise every classified entity counts. */
  onlyLocationIds?: Set<string>
): PlaceTypeAssignments => {
  const roots = useMemo(() => rootsOf(placeTypes), [placeTypes]);
  const concepts = useMemo(
    () => Array.from(new Set(roots.map((one) => one.conceptId).filter(Boolean))).sort(),
    [roots]
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

  // the name, order and description of every node is its Concept's label and
  // detail, and the pickers draw its tag; the trees' Concepts are fetched once
  const treeConceptIds = useMemo(() => {
    const ids = new Set<string>(concepts);
    Object.values(data?.response.trees ?? {}).forEach((tree) =>
      tree.nodes.forEach((node) => ids.add(node.id))
    );
    return [...ids].sort();
  }, [concepts, data]);
  const { data: treeEntities } = useEntitiesQuery("geocoding-type-concepts", treeConceptIds, {
    keepPrevious: true,
    staleTime: 60_000,
  });
  const conceptEntities = useMemo(() => {
    const map: Record<string, IResponseEntity> = {};
    for (const entity of treeEntities ?? []) {
      map[entity.id] = entity;
    }
    return map;
  }, [treeEntities]);

  const nodes = useMemo(() => {
    const byId: Record<string, TypeConcept> = {};
    for (const [id, entity] of Object.entries(conceptEntities)) {
      byId[id] = { label: entity.labels?.[0] ?? "", detail: entity.detail ?? "" };
    }
    return expandPlaceTypes(roots, data?.response.trees ?? {}, byId);
  }, [roots, data, conceptEntities]);

  // the tooltip of an inferred type says which classification it comes from, and
  // the server answers with ids; the few Concepts in question are fetched once
  const typesByLocation = useMemo(
    () => deriveTypeEntries(nodes, data?.response ?? EMPTY),
    [nodes, data]
  );
  const viaIds = useMemo(() => {
    const ids = new Set<string>();
    typesByLocation.forEach((entries) =>
      entries.forEach((one) => one.inferred && ids.add(one.via))
    );
    return [...ids].sort();
  }, [typesByLocation]);
  const { data: viaEntities } = useEntitiesQuery("geocoding-via-concepts", viaIds, {
    keepPrevious: true,
    staleTime: 60_000,
  });
  const viaLabels = useMemo(
    () =>
      Object.fromEntries(
        (viaEntities ?? []).map((entity) => [entity.id, entity.labels?.[0] ?? ""])
      ),
    [viaEntities]
  );

  return useMemo(() => {
    const response = data?.response ?? EMPTY;
    const countByType: Record<string, number> = {};
    const inferredByType: Record<string, number> = {};
    for (const node of nodes) {
      countByType[node.id] = 0;
      inferredByType[node.id] = 0;
    }

    typesByLocation.forEach((entries, entityId) => {
      if (onlyLocationIds && !onlyLocationIds.has(entityId)) {
        return;
      }
      for (const entry of entries) {
        if (!entryApplies(entry) || !(entry.typeId in countByType)) {
          continue;
        }
        countByType[entry.typeId]++;
        if (entry.inferred) {
          inferredByType[entry.typeId]++;
        }
      }
    });

    const truncatedTypes = roots
      .filter(
        (placeType) => placeType.conceptId && response.truncated.includes(placeType.conceptId)
      )
      .map((placeType) => placeType.id);

    const pendingTypes = roots
      .filter((placeType) => placeType.conceptId && !data?.asked.includes(placeType.conceptId))
      .map((placeType) => placeType.id);

    return {
      nodes,
      conceptEntities,
      typesByLocation,
      countByType,
      inferredByType,
      truncatedTypes,
      pendingTypes,
      viaLabels,
      isLoading,
      error: error ?? null,
    };
  }, [
    data,
    nodes,
    roots,
    conceptEntities,
    typesByLocation,
    onlyLocationIds,
    viaLabels,
    isLoading,
    error,
  ]);
};
