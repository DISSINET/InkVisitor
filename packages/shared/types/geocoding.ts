/**
 * Configuration for the Geocoding page.
 *
 * Two levels. Roles — which Concept or Resource entity plays which part — are
 * project-wide and set only by an owner or admin, because a role assignment is
 * what "geocoded" means: if one user could point `geometry` at a different Concept, the
 * same Location would read as geocoded for them and not for anyone else.
 *
 * Context is the query a researcher happens to be working in, so it layers:
 * a code default, then the project default, then the user's own.
 */

/**
 * How precisely a coordinate locates the place: the id of one of the Concepts the
 * project lists as its accuracies (`IGeocodingRoles.accuracies`).
 */
export type GeocodingAccuracy = string;

/**
 * The four accuracies a project had before it defined its own, under which a
 * settings row written then holds its Concepts (`accuracyValues`). Read only to
 * turn such a row into the list.
 */
export enum LegacyGeocodingAccuracy {
  Precise = "precise",
  Approximate = "approximate",
  Region = "region",
  Unknown = "unknown",
}

/**
 * The engine's result-side place types. Its `/parameters` also returns `any`,
 * which is a query-side wildcard it never returns as a result, so nothing here
 * maps it.
 */
export const GEOCODING_PLACE_TYPES = [
  "settlement",
  "fortress",
  "religious",
  "region",
  "river",
  "lake",
  "mountain",
  "island",
  "road",
  "archaeological",
  "battlefield",
  "port",
  "diocese",
  "ecclesiastical-province",
] as const;

export type GeocodingPlaceType = (typeof GEOCODING_PLACE_TYPES)[number];

/**
 * What each gazetteer location type is called and covers. Words rather than a code because
 * these are the engine's vocabulary: "religious" covers a chapel and a
 * monastery, and nobody guesses that from the word. `icon` is a key into the
 * client's icon set.
 */
export const ENGINE_PLACE_TYPE_INFO: Record<
  GeocodingPlaceType,
  { label: string; description: string; icon: string }
> = {
  settlement: {
    label: "settlement",
    description: "Somewhere people lived: a city, town, village or hamlet.",
    icon: "settlement",
  },
  fortress: {
    label: "fortress",
    description: "A castle, fort or fortified seat, walled and held rather than farmed.",
    icon: "fortress",
  },
  religious: {
    label: "religious house",
    description: "A church, chapel, monastery, abbey or other religious foundation.",
    icon: "religious",
  },
  region: {
    label: "region",
    description: "An area rather than a point: a province, duchy or district.",
    icon: "region",
  },
  river: {
    label: "river",
    description: "A river or stream. Its coordinate stands for a course, not a spot.",
    icon: "river",
  },
  lake: {
    label: "lake",
    description: "A lake, pond or other standing water.",
    icon: "lake",
  },
  mountain: {
    label: "mountain",
    description: "A peak, hill or range.",
    icon: "mountain",
  },
  island: {
    label: "island",
    description: "An island or group of them.",
    icon: "island",
  },
  road: {
    label: "road",
    description: "A road, route or pass, whose coordinate stands for a line.",
    icon: "road",
  },
  archaeological: {
    label: "archaeological site",
    description: "Remains rather than a settlement in use: ruins, a dig, an abandoned site.",
    icon: "archaeological",
  },
  battlefield: {
    label: "battlefield",
    description: "Where a battle or siege happened, named for the event rather than the place.",
    icon: "battlefield",
  },
  port: {
    label: "port",
    description: "A harbour, quay or landing place.",
    icon: "port",
  },
  diocese: {
    label: "diocese",
    description: "The area under a bishop, as a bounded territory.",
    icon: "cross",
  },
  "ecclesiastical-province": {
    label: "ecclesiastical province",
    description: "A group of dioceses under an archbishop, as a bounded territory.",
    icon: "region",
  },
};

/**
 * A location type as the project defines it.
 *
 * Distinct from the engine's types: the engine's types say what to ask the
 * gazetteers for, and these say what the project calls a Location. A Location
 * has a location type by being the subject of a Classification relation to `conceptId`.
 */
export interface IGeocodingPlaceType {
  /** Stable and never shown; what a default and a write refer to. */
  id: string;
  /**
   * What the location type is called while it has no Concept. Once it has one,
   * it is called by the Concept's label, and this is not shown or edited.
   */
  name: string;
  /** A key into the client's icon set, shared by every Concept of the type's subclass tree. */
  icon: string;
  /** The Concept a Location is classified under. Empty means not assigned yet. */
  conceptId: string;
  /**
   * The gazetteer location type this location type answers to, or null for a location type no gazetteer has a
   * word for. It decides which of the project's location types a suggestion's own type
   * points at.
   */
  engineType: GeocodingPlaceType | null;
  /** The location type offered first for its gazetteer location type; at most one per gazetteer location type. */
  favorite: boolean;
  /**
   * Concepts of the type's subclass tree, its own Concept included, that are not
   * offered for a new assignment. A Location already classified under one still
   * reads as it. Every other Concept of the tree is offered, a subclass added
   * later included: the tree is read from the superclass relations, not stored.
   */
  inactive: string[];
}

/** One kind per gazetteer location type, each paired with its own — the list a project starts from. */
export const defaultPlaceTypes = (): IGeocodingPlaceType[] =>
  GEOCODING_PLACE_TYPES.map((engineType) => ({
    id: engineType,
    name: ENGINE_PLACE_TYPE_INFO[engineType].label,
    icon: ENGINE_PLACE_TYPE_INFO[engineType].icon,
    conceptId: "",
    engineType,
    favorite: true,
    inactive: [],
  }));

/**
 * The list a stored value stands for.
 *
 * A row written before the list existed holds a map from gazetteer location type to Concept;
 * it becomes the default list with those Concepts assigned. Anything else that
 * is not a list is the default list, so a settings row is never the reason the
 * page has no location types to offer.
 */
export const normalizePlaceTypes = (stored: unknown): IGeocodingPlaceType[] => {
  if (Array.isArray(stored)) {
    return stored
      .filter((one) => one && typeof one === "object" && typeof one.id === "string")
      .map((one) => ({
        id: one.id,
        name: typeof one.name === "string" ? one.name : one.id,
        icon: typeof one.icon === "string" ? one.icon : "unknown",
        conceptId: typeof one.conceptId === "string" ? one.conceptId : "",
        engineType: GEOCODING_PLACE_TYPES.includes(one.engineType) ? one.engineType : null,
        favorite: !!one.favorite,
        inactive: Array.isArray(one.inactive)
          ? one.inactive.filter((id: unknown): id is string => typeof id === "string")
          : [],
      }));
  }
  const legacy: Record<string, unknown> =
    stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  return defaultPlaceTypes().map((one) => ({
    ...one,
    conceptId: typeof legacy[one.id] === "string" ? (legacy[one.id] as string) : "",
  }));
};

/**
 * The accuracies a stored settings row stands for.
 *
 * A row with a list is read as it is, an empty list included: an owner who
 * removed every accuracy keeps none. A row written before the list existed holds
 * a map from the four words to Concepts, which becomes the list in the order the
 * words were offered, with "precise" taken when the sources agree and
 * "approximate" when they are scattered. A Concept listed twice is kept once, and
 * a mark on a Concept not in the list is dropped.
 */
export const normalizeAccuracyRoles = (
  stored: unknown,
): Pick<IGeocodingRoles, "accuracies" | "accuracyWhenAgree" | "accuracyWhenScattered"> => {
  const roles: Record<string, unknown> =
    stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const unique = (ids: unknown[]) =>
    [...new Set(ids.filter((id): id is string => typeof id === "string" && !!id))];

  let accuracies: string[];
  let agree: unknown;
  let scattered: unknown;
  if (Array.isArray(roles.accuracies)) {
    accuracies = unique(roles.accuracies);
    agree = roles.accuracyWhenAgree;
    scattered = roles.accuracyWhenScattered;
  } else {
    const legacy: Record<string, unknown> =
      roles.accuracyValues && typeof roles.accuracyValues === "object"
        ? (roles.accuracyValues as Record<string, unknown>)
        : {};
    accuracies = unique(Object.values(LegacyGeocodingAccuracy).map((word) => legacy[word]));
    agree = legacy[LegacyGeocodingAccuracy.Precise];
    scattered = legacy[LegacyGeocodingAccuracy.Approximate];
  }
  const inList = (id: unknown) => (typeof id === "string" && accuracies.includes(id) ? id : "");
  return {
    accuracies,
    accuracyWhenAgree: inList(agree),
    accuracyWhenScattered: inList(scattered),
  };
};

/**
 * How the engine picks the one match whose coordinate a suggestion carries, as
 * its `representative` request field takes it. Every rule picks a real match,
 * never a point between them.
 */
export const GEOCODING_REPRESENTATIVES = [
  "place-first",
  "agreement",
  "best-score",
  "medoid",
  "densest",
] as const;

export type GeocodingRepresentative = (typeof GEOCODING_REPRESENTATIVES)[number];

/** The key of the citing distance for a search that named no location type, or `any`. */
export const CITE_WITHIN_ANY = "";

/**
 * How close a gazetteer's record must lie to the written coordinate to be
 * cited, in km, per gazetteer location type of the search.
 *
 * Half the distance at which the engine counts a source's agreement as fading
 * (its τ per place type, which also sets the radius it groups matches within,
 * 2.5 τ), so a record cited is well inside the group it came from.
 */
export const defaultCiteWithinKm = (): Record<string, number> => ({
  archaeological: 1.5,
  religious: 1.5,
  fortress: 2.5,
  port: 2.5,
  battlefield: 2.5,
  settlement: 5,
  diocese: 5,
  mountain: 7.5,
  road: 7.5,
  island: 10,
  river: 12.5,
  lake: 12.5,
  "ecclesiastical-province": 15,
  region: 30,
  [CITE_WITHIN_ANY]: 5,
});

/**
 * The citing settings a stored row stands for: an unknown or missing rule is the
 * engine's own default, and every distance the row does not hold, or holds as
 * anything but a positive number, is the default one.
 */
export const normalizeCitingRoles = (
  stored: unknown,
): Pick<IGeocodingRoles, "representative" | "citeWithinKm"> => {
  const roles: Record<string, unknown> =
    stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const representative = (GEOCODING_REPRESENTATIVES as readonly string[]).includes(
    roles.representative as string,
  )
    ? (roles.representative as GeocodingRepresentative)
    : "";
  const citeWithinKm = defaultCiteWithinKm();
  if (roles.citeWithinKm && typeof roles.citeWithinKm === "object") {
    for (const [type, km] of Object.entries(roles.citeWithinKm as Record<string, unknown>)) {
      if (typeof km === "number" && Number.isFinite(km) && km > 0) {
        citeWithinKm[type] = km;
      }
    }
  }
  return { representative, citeWithinKm };
};

/**
 * Entity ids, one per role. Empty means unassigned — the page then still lists,
 * filters and takes a coordinate from a map click, and only engine-driven
 * geocoding is unavailable.
 */
export interface IGeocodingRoles {
  /**
   * Concept whose prop carries the geometry: a Value entity whose label is one
   * GeoJSON geometry. Its presence is what makes a Location geocoded.
   */
  geometry: string;
  /**
   * Concept whose prop carries the accuracy. A subproperty of the geometry prop.
   */
  accuracy: string;
  /**
   * Concept whose prop names the source of the coordinate: a subproperty of the
   * geometry prop, valued with the Resource of a gazetteer that supplied it, one
   * per gazetteer. Optional: a project that has not assigned it records the
   * sources as references only.
   */
  epistemicSource: string;
  /**
   * The Concepts an accuracy prop may be valued with, in the order they are
   * offered. A row being filled in holds "", which is offered nowhere.
   */
  accuracies: string[];
  /**
   * The accuracy taken without asking when a suggestion's sources agree on the
   * spot (a card's main button, quick geocoding), or "" for none.
   */
  accuracyWhenAgree: string;
  /** The accuracy taken without asking when a suggestion's sources are scattered, or "" for none. */
  accuracyWhenScattered: string;
  /**
   * The project's location types. A location type with no Concept blocks the write
   * rather than being invented.
   */
  placeTypes: IGeocodingPlaceType[];
  /**
   * Resource per engine suggester name, keyed by the engine's own slug. Fifteen
   * of the sixteen suggesters are gazetteers; `llm-coords` is the model's own
   * guess, has no record to cite, and needs no Resource.
   */
  resources: Record<string, string>;
  /**
   * The engine's rule for which match a suggestion's coordinate is taken from,
   * sent with every search; "" sends none, which is the engine's own default.
   */
  representative: GeocodingRepresentative | "";
  /**
   * Per gazetteer location type of the search (`CITE_WITHIN_ANY` for none or
   * `any`), how close in km a gazetteer's record must lie to the written
   * coordinate for the gazetteer to be cited on the Location.
   */
  citeWithinKm: Record<string, number>;
}

/**
 * The four dimensions the engine scores a source's relevance on, and the four
 * fields the query context states.
 *
 * The same four names the engine's `contextWeights` is keyed by, deliberately:
 * a dimension and the field that fills it are one thing, and a second
 * vocabulary between them would be one more thing to keep in step.
 */
export const GEOCODING_QUERY_DIMENSIONS = ["region", "period", "language", "placeType"] as const;

export type GeocodingQueryDimension = (typeof GEOCODING_QUERY_DIMENSIONS)[number];

/**
 * How much each dimension counts when the engine decides which gazetteers to
 * ask and how much each one's answer weighs.
 *
 * Zero removes a dimension from the score AND from the filter: region and
 * period otherwise veto a source outright, and a dimension weighted to nothing
 * that went on quietly deciding which sources ran would be a filter nobody
 * asked for. Zeroing region therefore lets every source run, which is slower.
 */
export type IGeocodingContextWeights = Partial<Record<GeocodingQueryDimension, number>>;

/**
 * What each dimension counts when nothing says otherwise, mirrored from the
 * engine.
 *
 * Region counts double because it is the only one measured — from the source's
 * own records, binned into a 1° grid — where the other three are claims a
 * source makes about itself.
 */
export const DEFAULT_CONTEXT_WEIGHTS: Required<IGeocodingContextWeights> = {
  region: 2,
  period: 1,
  language: 1,
  placeType: 1,
};

/** The highest a dimension can be weighted here. The engine imposes no ceiling. */
export const MAX_CONTEXT_WEIGHT = 4;

/** An area, `[minLon, minLat, maxLon, maxLat]` — the engine's own order. */
export type GeocodingBbox = [number, number, number, number];

/** The query context a request is made in. Every field is optional to the engine. */
export interface IGeocodingContext {
  /**
   * Named regions, any of which the place may be in. None means no constraint.
   *
   * A hand-drawn `regionBbox` takes the place of these while one is set.
   */
  regions?: string[];
  /**
   * One region, as this field was stored before it took several.
   *
   * Read, and turned into `regions`, when `regions` says nothing; written only
   * as an empty string, to blank a value an older save left behind.
   */
  region?: string;
  /**
   * An area drawn by hand, for what the named region list does not cover.
   *
   * Mutually exclusive with `region`: the engine refuses a request carrying
   * both with 422 rather than reconciling them, so a box set here is the
   * region and whatever `region` holds is not sent.
   *
   * Weaker than a named region by construction. A name is checked against a
   * source's declared ancestry; a box has only its geometry, and a rectangle
   * that models an area poorly misleads the engine in the direction of its own
   * corners. Prefer a named region wherever one fits.
   */
  regionBbox?: GeocodingBbox | null;
  /** Named periods, any of which may apply. None means no constraint. */
  periods?: string[];
  /** One period, as stored before the field took several. Read like `region`. */
  period?: string;
  /**
   * What language the name being searched for is probably in — several are
   * normal, and none means no constraint.
   *
   * It says what the engine has been handed, not which languages to search: the
   * naming step generates forms in other languages on purpose, so a language
   * here lifts a source that indexes one of them and never penalises one that
   * does not.
   */
  languages?: string[];
  /**
   * One language, as this field was stored before it took several.
   *
   * Read when `languages` is absent and never written. A context saved under
   * the single-value field outlives the change on any deployment that had one.
   */
  language?: string;
  /** Gazetteer location types the name may be, any of them. None means no constraint. */
  placeTypes?: string[];
  /** One gazetteer location type, as stored before the field took several. Read like `region`. */
  placeType?: string;
  /**
   * Gazetteers the engine is not to ask, by its own source name.
   *
   * The one context field whose two layers UNION rather than replace. A project
   * switching a source off is a statement about the corpus — it is not licensed
   * for this work, or it holds nothing this corpus is about — and that is not a
   * researcher's to overrule from their own preferences; a researcher switching
   * one off is about their own runs. Every other list field replaces, which
   * here would let either layer silently erase the other's refusal.
   *
   * Distinct from weighting a source down: a disabled source is never asked, so
   * it costs nothing and returns nothing. `sourceWeights` is what says "ask, but
   * count it for less", and nothing here sets that.
   */
  disabledSources?: string[];
  /**
   * How much each dimension counts, per dimension, over the engine's defaults.
   *
   * Part of the engine's cache key, because it changes the answer: one measured
   * `Breslau` query scored 0.705 under the defaults and 0.656 under region
   * alone.
   */
  contextWeights?: IGeocodingContextWeights;
  /** The engine's LLM preference: fastest, best, or local-only. */
  taskCategory?: "quick" | "quality" | "offline";
  /** Run the engine as soon as a Location is selected. */
  autoSearch?: boolean;
  /**
   * The accuracy marked in the menu a map click opens, as the one usually meant:
   * a Concept of the project's accuracies. A value written before the project
   * defined its own list is a word that matches none of them, and marks nothing.
   */
  mapClickAccuracy?: GeocodingAccuracy;
  /**
   * Whether accepting a coordinate also records what location type it is.
   *
   * A project that has not mapped the engine's twelve types onto its own
   * Concepts has nothing to write, and a suggestion often has no single type of
   * its own, so the type is asked for rather than inferred. Off means the
   * coordinate is written and the place's location type is left alone.
   */
  recordPlaceType?: boolean;
  /**
   * The location type written on every Location when the question is not asked.
   *
   * Only read while `recordPlaceType` is off. A corpus that is all of one location type —
   * a register of parishes, a list of monasteries — has an answer that is the
   * same every time, and asking for it once is the difference between recording
   * it and recording nothing. Undefined leaves each Location's location type alone, which
   * is what turning the question off used to mean on its own. Null means the
   * same thing, chosen explicitly: the settings modal writes null rather than
   * leaving the field untouched when the researcher picks "leave each one
   * alone" for a corpus that previously had a location type named.
   */
  defaultPlaceType?: string | null;
  /**
   * Whether the engine treats two name forms differing only by accents as one.
   *
   * A question about the material rather than about the engine: `Zobten` and
   * `Zobtén` are usually one name written two ways, while `Milicz` and `Milicž`
   * may be two genuinely attested spellings, and collapsing those throws one
   * away. Off leaves both searched.
   */
  dedupeDiacritics?: boolean;
  /**
   * What a geocode that asks nobody is allowed to accept.
   *
   * A quick geocode writes without a person reading the run, so this is the one
   * place the corpus states how much of that it wants. Absent means the strict
   * reading — a batch that silently guessed would be discovered a thousand rows
   * later, and a default has to be the one that fails safely.
   */
  quickStrategy?: "clearWinner" | "topScore";
  /**
   * Whether a geocode that asks nobody may take an answer the engine placed
   * outside the query's region.
   *
   * A corpus does cross its own borders — an exile's monastery, a bishop's other
   * see — so these are demoted rather than hidden, and a person weighing one has
   * the region in front of them. A quick geocode does not, which is why the
   * absent value refuses: a score says how well the sources agree about a name,
   * not whether the place they agree on belongs here.
   */
  quickTakeOffRegion?: boolean;
}

/** The project-wide settings row, stored under one key so it is read and written whole. */
export interface IGeocodingSettings {
  roles: IGeocodingRoles;
  context: IGeocodingContext;
}

/** A user's personal overrides. Roles are deliberately absent. */
export interface IGeocodingUserSettings {
  context: IGeocodingContext;
}

export const GEOCODING_SETTINGS_KEY = "geocoding";

/**
 * Whether two of the coordinate roles are given the same Concept.
 *
 * The geometry, the accuracy and the source are told apart by their Concept, so
 * one Concept in two roles makes the geometry prop and the accuracy under it
 * indistinguishable from each other. Unassigned roles are not a clash.
 */
export const rolesShareAConcept = (
  roles: Pick<IGeocodingRoles, "geometry" | "accuracy" | "epistemicSource">,
): boolean => {
  const assigned = [roles.geometry, roles.accuracy, roles.epistemicSource].filter(Boolean);
  return new Set(assigned).size !== assigned.length;
};

export const emptyGeocodingRoles = (): IGeocodingRoles => ({
  geometry: "",
  accuracy: "",
  epistemicSource: "",
  accuracies: [],
  accuracyWhenAgree: "",
  accuracyWhenScattered: "",
  placeTypes: defaultPlaceTypes(),
  resources: {},
  representative: "",
  citeWithinKm: defaultCiteWithinKm(),
});

export const defaultGeocodingContext = (): IGeocodingContext => ({
  autoSearch: true,
  taskCategory: "quick",
  recordPlaceType: true,
});

/** What GET /geocoding/health answers: whether an engine address is set, and whether the engine answered. */
export interface IGeocodingHealth {
  configured: boolean;
  ok?: boolean;
}
