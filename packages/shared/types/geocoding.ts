/**
 * Configuration for the Geocoding page.
 *
 * Two levels. Roles — which Concept or Resource entity plays which part — are
 * project-wide and set only by an owner or admin, because a role assignment is
 * what "geocoded" means: if one user could point `x` at a different Concept, the
 * same Location would read as geocoded for them and not for anyone else.
 *
 * Context is the query a researcher happens to be working in, so it layers:
 * a code default, then the project default, then the user's own.
 */

/** How precisely a coordinate locates the place. */
export enum GeocodingAccuracy {
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
] as const;

export type GeocodingPlaceType = (typeof GEOCODING_PLACE_TYPES)[number];

/**
 * Entity ids, one per role. Empty means unassigned — the page then still lists,
 * filters and takes a coordinate from a map click, and only engine-driven
 * geocoding is unavailable.
 */
export interface IGeocodingRoles {
  /** Concept whose prop carries longitude. Its presence is what makes a Location geocoded. */
  x: string;
  /** Concept whose prop carries latitude. */
  y: string;
  /** Concept whose prop carries the accuracy. */
  accuracy: string;
  /** Concept whose prop carries the place type. */
  type: string;
  /** Concept per accuracy value — these are the prop's possible values. */
  accuracyValues: Partial<Record<GeocodingAccuracy, string>>;
  /** Concept per engine place type. An unmapped type blocks the write rather than being invented. */
  placeTypes: Partial<Record<GeocodingPlaceType, string>>;
  /**
   * Resource per engine suggester name, keyed by the engine's own slug. Fifteen
   * of the sixteen suggesters are gazetteers; `llm-coords` is the model's own
   * guess, has no record to cite, and needs no Resource.
   */
  resources: Record<string, string>;
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
  /** Written when a coordinate is set by clicking the map rather than accepting a suggestion. */
  mapClickAccuracy?: GeocodingAccuracy;
  /**
   * Whether accepting a coordinate also records what kind of place it is.
   *
   * A project that has not mapped the engine's twelve types onto its own
   * Concepts has nothing to write, and a suggestion often has no single type of
   * its own, so the type is asked for rather than inferred. Off means the
   * coordinate is written and the place's kind is left alone.
   */
  recordPlaceType?: boolean;
  /**
   * The kind of place written on every Location when the question is not asked.
   *
   * Only read while `recordPlaceType` is off. A corpus that is all of one kind —
   * a register of parishes, a list of monasteries — has an answer that is the
   * same every time, and asking for it once is the difference between recording
   * it and recording nothing. Undefined leaves each Location's kind alone, which
   * is what turning the question off used to mean on its own. Null means the
   * same thing, chosen explicitly: the settings modal writes null rather than
   * leaving the field untouched when the researcher picks "leave each one
   * alone" for a corpus that previously had a kind named.
   */
  defaultPlaceType?: GeocodingPlaceType | null;
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

export const emptyGeocodingRoles = (): IGeocodingRoles => ({
  x: "",
  y: "",
  accuracy: "",
  type: "",
  accuracyValues: {},
  placeTypes: {},
  resources: {},
});

export const defaultGeocodingContext = (): IGeocodingContext => ({
  autoSearch: true,
  mapClickAccuracy: GeocodingAccuracy.Approximate,
  taskCategory: "quick",
  recordPlaceType: true,
});
