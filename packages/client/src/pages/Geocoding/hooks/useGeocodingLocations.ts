import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseEntity } from "@inkvisitor/shared/types";
import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useEntitiesQuery } from "hooks/react-query/useEntitiesQuery";
import { useMemo } from "react";
import {
  DerivedGeocoding,
  canDerive,
  collectGeoValueIds,
  deriveGeocoding,
} from "../utils/write/geocodingDerivation";
import { LocationTypeEntry, usePlaceTypeAssignments } from "./usePlaceTypeAssignments";

/**
 * The one collection the list, the map and every count read.
 *
 * Two fetches, not two collections. A Location search returns each prop's value
 * *id* and nothing more, so the coordinate numbers — which are the labels of
 * separate Value entities — need a second, batched lookup. Both feed one memo,
 * so nothing downstream can disagree with anything else about which places are
 * geocoded or where they sit.
 */

export interface GeocodingLocation extends DerivedGeocoding {
  entity: IResponseEntity;
  /**
   * Every location type the Location comes under that is shown — classified
   * under the type's own Concept or under one of its subclasses or synonyms,
   * the first kind before the second, each in the order the project lists its
   * location types. A type another of them lies below is not among them.
   */
  placeTypes: string[];
  /**
   * The same, and the types left out, each with how the Location comes under it.
   * `placeTypes` is these without the shadowed ones.
   */
  typeEntries: LocationTypeEntry[];
}

/** Filters the server can answer. Geocoded state and accuracy cannot be asked of it. */
export interface GeocodingServerFilters {
  label?: string;
  territoryId?: string;
  subTerritorySearch?: boolean;
  language?: EntityEnums.Language;
  status?: EntityEnums.Status;
  createdBy?: string;
}

export interface UseGeocodingLocations {
  locations: GeocodingLocation[];
  geocodedCount: number;
  /** The labels of the Concepts the Locations' inferred location types come through, by id. */
  viaLabels: Record<string, string>;
  /** True while either fetch is outstanding. */
  isLoading: boolean;
  /** The Locations request failed — the InkVisitor server, not the geocoding engine. */
  error: unknown;
}

export const useGeocodingLocations = (
  roles: IGeocodingRoles,
  filters: GeocodingServerFilters,
): UseGeocodingLocations => {
  const {
    data: entities,
    isFetching: loadingEntities,
    error,
  } = useQuery({
    queryKey: ["geocoding-locations", filters],
    queryFn: async () => {
      const response = await api.entitiesSearch({
        class: EntityEnums.Class.Location,
        ...filters,
      });
      return response.data ?? [];
    },
    enabled: api.isLoggedIn(),
  });

  // recomputed only when the roles or the result set change, so typing in a
  // filter does not re-derive ids for a list that has not arrived yet
  const valueIds = useMemo(
    () => collectGeoValueIds(entities || [], roles),
    [entities, roles],
  );

  const assignments = usePlaceTypeAssignments(roles.placeTypes);

  const { data: values, isFetching: loadingValues } = useEntitiesQuery(
    "geocoding-values",
    valueIds,
  );

  return useMemo(() => {
    /**
     * A coordinate is two props pointing at Value entities, and those arrive in
     * a second request. Deriving before they land reads every stored coordinate
     * as unreadable and every geocoded Location as not geocoded — which the
     * panel then prints, in the colour it keeps for a corpus that is broken.
     *
     * So there is no half-derived state: until the Values for these entities are
     * in hand there are no Locations, and the list says it is loading. A refetch
     * keeps the Values it already has, so this only ever costs the first load.
     */
    if (!canDerive(valueIds, values)) {
      return { locations: [], geocodedCount: 0, viaLabels: {}, isLoading: true, error };
    }

    const byId: Record<string, IResponseEntity> = {};
    for (const value of values || []) {
      byId[value.id] = value;
    }

    const locations: GeocodingLocation[] = (entities || []).map((entity) => {
      const entries = assignments.typesByLocation.get(entity.id) ?? [];
      const shown = entries.filter((entry) => !entry.shadowed).map((entry) => entry.typeId);
      return {
        entity,
        ...deriveGeocoding(entity, roles, byId),
        placeType: shown[0] ?? null,
        placeTypes: shown,
        typeEntries: entries,
      };
    });

    return {
      locations,
      geocodedCount: locations.filter((location) => location.isGeocoded).length,
      viaLabels: assignments.viaLabels,
      isLoading: loadingEntities || loadingValues || assignments.isLoading,
      error,
    };
  }, [entities, values, valueIds, roles, loadingEntities, loadingValues, error, assignments]);
};
