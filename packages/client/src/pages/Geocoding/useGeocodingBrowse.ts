import { entityStatusDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { DropdownItem } from "@inkvisitor/shared/types";
import {
  GEOCODING_PLACE_TYPES,
  GeocodingAccuracy,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { useOrderedLanguageDict } from "hooks/react-query";
import { useUsersSimplifiedQuery } from "hooks/react-query/useUsersSimplifiedQuery";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  COLLAPSED_BY_DEFAULT,
  Collapsed,
  GroupBy,
  LocationGroup,
  WriteOrder,
  groupsOf,
} from "./geocodingGroups";
import { GeocodingLocation, useGeocodingLocations } from "./useGeocodingLocations";

/**
 * The page's one collection, and the filters over it.
 *
 * This sits above both the list and the map so neither fetches its own —
 * a map showing different places from the list beside it is the failure that
 * invariant forecloses.
 */

export const ANY = "any";

export const anyOption: DropdownItem = { value: ANY, label: "any" };

export const accuracyOptions: DropdownItem[] = [
  anyOption,
  ...Object.values(GeocodingAccuracy).map((value) => ({ value, label: value })),
];

/** Locations that state no kind of place. Not the same as "any". */
export const NO_PLACE_TYPE = "__none";

export interface GeocodingFilters {
  label: string;
  /** Whose Locations these are. Asked of the server. */
  createdBy: string;
  /** The territory the list is scoped to, or ANY. Asked of the server. */
  territoryId: string;
  /**
   * Whether the territories below the chosen one are in scope.
   *
   * A separate question from which territory: the search matches `territoryId`
   * exactly unless told otherwise, and for a corpus organised into nested
   * territories the two readings of "scope to Silesia" are very different.
   */
  subTerritories: string;
  accuracy: string;
  placeType: string;
  language: string;
  status: string;
}

export interface UseGeocodingBrowse {
  /** Everything the server returned, before the client-side filters. */
  all: GeocodingLocation[];
  /** What the filters leave — what the list shows. */
  visible: GeocodingLocation[];
  /**
   * The geocoded Locations the list is showing.
   *
   * Drawn from what the filters leave rather than from the whole collection: the
   * filters are the page's one statement about what is being worked on, and a
   * map holding places the list excludes answers the same question twice.
   */
  geocoded: GeocodingLocation[];
  geocodedCount: number;
  isLoading: boolean;
  error: unknown;
  filters: GeocodingFilters;
  setFilter: <K extends keyof GeocodingFilters>(key: K, value: GeocodingFilters[K]) => void;
  languageOptions: DropdownItem[];
  statusOptions: DropdownItem[];
  /**
   * Who has created Locations, as filter options.
   *
   * Every user rather than only those with Locations: the server answers this
   * filter, so the browser holds no population to draw the list from, and a
   * choice that empties the list is a true answer about the corpus.
   */
  createdByOptions: DropdownItem[];
  /**
   * The kinds of place actually present in what the server returned, plus a
   * choice for the Locations that state none.
   *
   * Built from the data rather than from the vocabulary: a corpus where nothing
   * has been typed yet would otherwise offer twelve choices that all empty the
   * list, and the list would look broken rather than the corpus untyped.
   */
  placeTypeOptions: DropdownItem[];
  /** How the list is arranged. Never changes which Locations it holds. */
  groupBy: GroupBy;
  setGroupBy: (groupBy: GroupBy) => void;
  /** The visible Locations, arranged. */
  groups: LocationGroup[];
  /** Records that a Location was written now, so it joins the end of its group. */
  markWritten: (locationId: string) => void;
  /** Opens or closes one group. A collapsed group still shows this session's writes. */
  toggleGroup: (key: string) => void;
  /**
   * How many rows each option of each client-side filter would leave.
   *
   * Counted with that filter's own choice lifted and every other one in force,
   * which is the only reading that answers "what happens if I pick this".
   */
  optionCounts: Record<string, Record<string, number>>;
  /** Every filter back to "any" and the name search cleared. */
  clearFilters: () => void;
}

/**
 * The kinds of place present in a collection, as filter options.
 *
 * Built from the data rather than from the vocabulary. A corpus where nothing
 * has been typed would otherwise offer twelve choices that each empty the list,
 * which reads as the filter being broken rather than the corpus being untyped —
 * so with none present it says so and offers nothing to choose.
 */
export const placeTypeOptionsFor = (locations: { placeType: string | null }[]): DropdownItem[] => {
  const present = new Set<string>();
  let untyped = false;
  for (const location of locations) {
    if (location.placeType) {
      present.add(location.placeType);
    } else {
      untyped = true;
    }
  }
  // in vocabulary order rather than by how many carry each, so the list does not
  // reorder itself as places are typed
  const typed = GEOCODING_PLACE_TYPES.filter((placeType) => present.has(placeType)).map(
    (placeType) => ({ value: placeType as string, label: placeType as string }),
  );
  if (!typed.length) {
    return [{ value: ANY, label: "no kinds recorded yet" }];
  }
  return [
    anyOption,
    ...typed,
    ...(untyped ? [{ value: NO_PLACE_TYPE, label: "no kind recorded" }] : []),
  ];
};

/** Whether a Location survives the place type filter. */
export const matchesPlaceType = (placeType: string | null, filter: string): boolean => {
  if (filter === ANY) {
    return true;
  }
  if (filter === NO_PLACE_TYPE) {
    return !placeType;
  }
  return placeType === filter;
};

export const useGeocodingBrowse = (roles: IGeocodingRoles): UseGeocodingBrowse => {
  const [filters, setFilters] = useState<GeocodingFilters>({
    label: "",
    createdBy: ANY,
    territoryId: ANY,
    subTerritories: "included",
    accuracy: ANY,
    placeType: ANY,
    language: ANY,
    status: ANY,
  });

  const setFilter: UseGeocodingBrowse["setFilter"] = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  // the coordinate state is what the list is worked through by, so it is what
  // the list is arranged by until the researcher says otherwise
  const [groupBy, setGroupBy] = useState<GroupBy>("coords");

  /**
   * When each Location was written in this session.
   *
   * A counter rather than a clock: two writes inside the same millisecond would
   * otherwise tie, and the tie would put the row the researcher just finished
   * in an arbitrary place relative to the one before it.
   */
  const [collapsed, setCollapsed] = useState<Collapsed>(COLLAPSED_BY_DEFAULT);
  const toggleGroup = useCallback(
    (key: string) => setCollapsed((current) => ({ ...current, [key]: !current[key] })),
    [],
  );

  const [writeOrder, setWriteOrder] = useState<WriteOrder>({});
  const writeCount = useRef(0);
  const markWritten = useCallback((locationId: string) => {
    writeCount.current += 1;
    const at = writeCount.current;
    setWriteOrder((current) => ({ ...current, [locationId]: at }));
  }, []);

  const orderedLanguages = useOrderedLanguageDict();
  const languageOptions = useMemo(() => [anyOption, ...orderedLanguages], [orderedLanguages]);
  const statusOptions = useMemo(() => [anyOption, ...entityStatusDict], []);

  const { data: users } = useUsersSimplifiedQuery();
  const createdByOptions = useMemo(
    () => [
      anyOption,
      ...(users || []).map((user) => ({ value: user.id, label: user.name || user.id })),
    ],
    [users],
  );

  const { locations, geocodedCount, isLoading, error } = useGeocodingLocations(roles, {
    // one character matches most of the corpus, which is not a search
    label: filters.label.length > 1 ? filters.label : undefined,
    createdBy: filters.createdBy === ANY ? undefined : filters.createdBy,
    territoryId: filters.territoryId === ANY ? undefined : filters.territoryId,
    subTerritorySearch:
      filters.territoryId !== ANY && filters.subTerritories === "included" ? true : undefined,
    language: filters.language === ANY ? undefined : (filters.language as EntityEnums.Language),
    status: filters.status === ANY ? undefined : (filters.status as EntityEnums.Status),
  });

  // everything except the place type filter, which is what its own options are
  // drawn from: options taken from the whole collection would offer a kind the
  // current view cannot contain, and options taken from the result would vanish
  // as soon as one was chosen
  const beforePlaceType = useMemo(
    () =>
      locations.filter(
        (location) => filters.accuracy === ANY || location.accuracy === filters.accuracy,
      ),
    [locations, filters.accuracy],
  );

  const visible = useMemo(
    () =>
      beforePlaceType.filter((location) =>
        matchesPlaceType(location.placeType, filters.placeType),
      ),
    [beforePlaceType, filters.placeType],
  );

  const geocoded = useMemo(
    () => visible.filter((location) => location.isGeocoded),
    [visible],
  );

  const groups = useMemo(
    () => groupsOf(visible, groupBy, writeOrder, collapsed),
    [visible, groupBy, writeOrder, collapsed],
  );

  const placeTypeOptions = useMemo(() => placeTypeOptionsFor(beforePlaceType), [beforePlaceType]);

  /**
   * What each option of each client-side filter would leave.
   *
   * Only accuracy and kind of place: language and status are asked of the
   * server, so the collection here has already been narrowed by them and a
   * count over it would say the same number for every option.
   */
  const optionCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = { accuracy: {}, placeType: {} };
    const underPlaceType = locations.filter((location) =>
      matchesPlaceType(location.placeType, filters.placeType),
    );
    counts.accuracy[ANY] = underPlaceType.length;
    for (const accuracy of Object.values(GeocodingAccuracy)) {
      counts.accuracy[accuracy] = underPlaceType.filter(
        (location) => location.accuracy === accuracy,
      ).length;
    }
    const underAccuracy = locations.filter(
      (location) => filters.accuracy === ANY || location.accuracy === filters.accuracy,
    );
    counts.placeType[ANY] = underAccuracy.length;
    counts.placeType[NO_PLACE_TYPE] = underAccuracy.filter(
      (location) => !location.placeType,
    ).length;
    for (const placeType of GEOCODING_PLACE_TYPES) {
      counts.placeType[placeType] = underAccuracy.filter(
        (location) => location.placeType === placeType,
      ).length;
    }
    return counts;
  }, [locations, filters.accuracy, filters.placeType]);

  const clearFilters = useCallback(
    () =>
      setFilters({
        label: "",
        createdBy: ANY,
        territoryId: ANY,
        subTerritories: "included",
        accuracy: ANY,
        placeType: ANY,
        language: ANY,
        status: ANY,
      }),
    [],
  );

  return {
    all: locations,
    visible,
    geocoded,
    geocodedCount,
    isLoading,
    error,
    filters,
    setFilter,
    languageOptions,
    statusOptions,
    createdByOptions,
    placeTypeOptions,
    optionCounts,
    clearFilters,
    groupBy,
    setGroupBy,
    groups,
    markWritten,
    toggleGroup,
  };
};
