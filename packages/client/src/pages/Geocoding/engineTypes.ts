/**
 * The HGA-Engine's response shape, mirrored from its `src/types.ts`.
 *
 * Only the fields this page reads are declared. The engine owns this contract;
 * when it changes, this file follows rather than the other way round.
 */

/** How a source matched the search term against its own data. */
export type MatchType = "exact" | "alias" | "fuzzy" | "hint";

/** One hit from one source. */
export interface EngineMatch {
  lat: number;
  lon: number;
  label: string;
  matchType: MatchType;
  /**
   * The source's own relevance number where it publishes one. Heterogeneous
   * between sources and null for most of them, so it is shown as provenance and
   * never compared across rows.
   */
  confidence: number | null;
  source: string;
  /** The source's verbatim type string, before normalisation. */
  placeType?: string;
  notes?: string;
  bbox?: [number, number, number, number];
  candidateIndex: number;
  candidateScore?: number;
  /**
   * The years this name is attested for, where the source publishes them.
   * Negative for BC, and either end may be open. Five of the sixteen sources
   * know a range at all, so most matches carry neither.
   *
   * A display field only. Deriving confidence from it would rate a quarter of
   * the matches by measurement and the rest by absence.
   */
  from?: number | null;
  to?: number | null;
  /**
   * The record's id in the source database. Every gazetteer publishes one; the
   * single exception is `llm-coords`, which is a model guess with no record
   * behind it.
   */
  sourceId?: string;
  sourceUrl?: string;
}

/** The components behind a suggestion's score. */
export interface SuggestionSignals {
  convergence: number;
  matchScore: number;
  candidateDiversity: number;
  candidateScore: number;
  evidence: number;
  /** Multiplier, not an additive component. */
  contextGate: number;
  /** Multiplier, not an additive component. */
  candidatePrior: number;
  /** Multiplier: 0.3 off-region, else 1. */
  offRegionFactor: number;
  /** Raw count of distinct sources. Comparable between places, unlike `score`. */
  agreement: number;
}

export interface PlaceTypeEvidence {
  source: string;
  raw: string;
}

export interface SuggestionAttachment {
  url: string;
  source: "picture-wiki" | "satellite";
  attribution?: string;
  license?: string;
}

export interface Suggestion {
  lat: number;
  lon: number;
  label: string;
  /**
   * `evidence × contextGate × candidatePrior × offRegionFactor`, 0–1.
   *
   * Orders suggestions WITHIN one query and means nothing between queries: the
   * engine runs a different set of sources per query, so the denominator moves.
   * Never sort a list of places by it, never render it as a percentage.
   */
  score: number;
  signals: SuggestionSignals;
  /**
   * Computed for the top 10 only. `null` means "not judged", which is not the
   * same as judged poorly.
   */
  contextFit?: number | null;
  /**
   * The MEDIAN distance from the highest-scoring match to each of the others,
   * so half the matches behind a suggestion sit further out than this. It is not
   * the width of the group, and the engine publishes no field that is.
   *
   * It can exceed `mergeRadiusKm`: grouping anchors on the first match and never
   * recentres, so a chain of matches each within the radius of its neighbour
   * spans more than the radius.
   */
  spreadKm: number;
  /** Outside the query's resolved region. Demoted rather than hidden, and common. */
  offRegion: boolean;
  /** One of the engine's 12 result-side ids, or null. Never invented. */
  placeType: string | null;
  placeTypeEvidence: PlaceTypeEvidence[];
  bbox: [number, number, number, number];
  matches: EngineMatch[];
  sources: string[];
  attachment?: SuggestionAttachment;
}

/**
 * What one source did on one request. A `count` of 0 means different things per
 * status, which is the entire reason this array exists.
 */
export interface SourceOutcome {
  name: string;
  status: "ran" | "skipped" | "disabled" | "unavailable" | "failed";
  count: number;
  /**
   * How long this source took. On a cached response these are the ORIGINAL
   * request's timings, replayed verbatim, so they are not a measurement of the
   * request that carried them.
   */
  ms: number;
  reason?: string;
  /**
   * The source answered, but not for every name variant. `status` stays `ran`
   * because what came back is real; this says the set is incomplete, so its
   * count is a floor rather than the whole of what the source holds.
   */
  partial?: boolean;
  /**
   * Excluded because its circuit breaker is open, so it will return on its own
   * within a minute. Reported as `unavailable` like a source whose data never
   * loaded, which will not come back without an engine restart.
   */
  benched?: boolean;
}

export interface LogEntry {
  task: string;
  message: string;
  ms: number;
}

/**
 * One name form the language model proposed searching for. Echoed back on the
 * response, which is how a suggestion can say why it turned up: "this appeared
 * because we searched Vratislavia".
 */
export interface EngineCandidate {
  name: string;
  description: string;
  /** How likely this name form denotes the place meant, 0–1. */
  nameFit: number;
  /** How well attested the form is — distinct from whether it is the right one. */
  attestation: number;
  /**
   * Which language model proposed this name form, or `"none"` when the provider
   * was rate-limited and the engine fell back to searching the bare name. The
   * fallback returns HTTP 200 and a plausible answer, so this is the only place
   * it is visible.
   */
  llmProvider: string;
  llmModel: string;
}

/** Per-dimension weights on the engine's context scoring. */
export interface ContextWeights {
  region?: number;
  period?: number;
  language?: number;
  placeType?: number;
}

export interface SuggestRequest {
  name: string;
  /**
   * What language the name is probably in. One or several; a bare string is
   * read as a one-element list.
   *
   * It says what the engine has been handed rather than which languages to
   * search — the naming step generates forms in other languages deliberately —
   * so it lifts a source indexing one of them and never penalises one that
   * does not.
   */
  language?: string | string[];
  period?: string;
  region?: string;
  /**
   * A hand-drawn area, `[minLon, minLat, maxLon, maxLat]`, for what the named
   * region list does not cover.
   *
   * Mutually exclusive with `region`: both together is 422, not a merge. So is
   * a box crossing the antimeridian, a box of zero width or height, and
   * coordinates off the map. Both `/suggest` and `/suggest/stream` validate
   * identically, and the body of a refusal is `{ "error": "<message>" }`.
   *
   * Weaker than a named region by construction: a name is checked against a
   * source's declared ancestry, a box has only geometry, and a rectangle that
   * models an area badly misleads the engine along its own corners.
   */
  regionBbox?: [number, number, number, number];
  place_type?: string;
  /**
   * How much each dimension counts on the weighted mean behind source
   * relevance. Every field optional; the engine's defaults are
   * `{ region: 2, period: 1, language: 1, placeType: 1 }`, region counting
   * double because it is the only dimension measured from a source's own
   * records rather than declared by the source about itself.
   *
   * Zero removes a dimension from the score AND lifts its veto — region and
   * period otherwise skip a source outright, and a dimension weighted to
   * nothing that went on deciding which sources ran would be a filter nobody
   * asked for. Zeroing region lets every source run, which is slower.
   *
   * Part of the cache key: the same query under different weights is two
   * questions and both answers are kept.
   */
  contextWeights?: ContextWeights;
  /**
   * How far apart two matches may sit and still be merged, in km, over the
   * place-type-derived default. Clamped by the engine to [0.1, 500] and part of
   * the cache key.
   */
  mergeRadiusKm?: number;
  clientId?: string;
  sourceWeights?: Record<string, number>;
  disabledSources?: string[];
  /**
   * Which language-model providers the engine may use. Unset is right for one
   * researcher at a keyboard: the default provider answers a single request
   * faster. A bulk run must pass `["mistral"]`, whose allowance is per minute
   * rather than per day — the default's daily ceiling works out at about 87
   * places, which no amount of engine speed can move.
   */
  providers?: string[];
  taskCategory?: "quick" | "quality" | "offline";
  /**
   * Whether two name forms differing only by their accents are one search.
   *
   * Off by default and deliberately not decided for the researcher: whether
   * `Zobten` and `Zobtén` are one name written twice or two attested spellings
   * is a question about the material, and folding them throws one away. Forms
   * differing only in case are always collapsed, which is never a real
   * distinction.
   *
   * Part of the engine's cache key: the same query with this on and off are two
   * different questions and both answers are kept.
   */
  dedupeDiacritics?: boolean;
  /** Present on the echoed query, absent on one being sent. */
  candidates?: EngineCandidate[];
  /**
   * What the engine made of the fields above, present on the echoed query only.
   *
   * The resolved form rather than the asked one: `languageIds` is always a
   * list however `language` was sent, `regionBbox` is filled in from the named
   * region as well as from a hand-drawn box, and a reversed period range is
   * corrected here rather than vetoing every source that declares a period.
   */
  criteria?: {
    regionId?: string;
    regionBbox?: [number, number, number, number];
    periodId?: string;
    periodRange?: { start: number; end: number };
    languageIds?: string[];
    placeTypeId?: string;
  };
}

export interface SuggestResponse {
  suggestions: Suggestion[];
  query: SuggestRequest;
  sources: SourceOutcome[];
  /**
   * Which frame of `/suggest/stream` this is, always equal to the SSE event
   * name. Absent on `POST /suggest`, which has only one answer to give.
   *
   * `accepted` carries nothing but `requestId` - no suggestions, no sources -
   * so it is a frame to read an id from and never a frame to render.
   */
  phase?: "accepted" | "provisional" | "final" | "error";
  /**
   * Identifies this request on the engine's audit log, from the `accepted`
   * frame onward. The same value as `id` on the entries `GET /state/stream`
   * publishes, which is what makes the progress line follow this request rather
   * than whatever else this browser has running.
   *
   * Absent on `POST /suggest`, deliberately: that response body is cached, so an
   * id inside it would be replayed to later callers and point at an audit entry
   * that has long since aged out of the ring.
   */
  requestId?: string;
  /**
   * `(top − second) / top`. Comparable between places, unlike `score`.
   *
   * Absent on a provisional frame: the margin is measured after the rating
   * re-sorts, so before that there is no top pair to compare.
   */
  margin?: number | null;
  /** True when the context pass ran for ANY suggestion, so never read it per row. */
  contextEvaluated?: boolean;
  log?: LogEntry[];
  /**
   * How long THIS request took. A response served from the engine's cache
   * reports single-digit milliseconds, which is a true measurement of the
   * request and not of the work behind the answer.
   */
  elapsed_ms: number;
  /**
   * Served from the engine's response cache, which holds an answer for six
   * hours and is keyed on the query alone. A degraded answer is never cached,
   * so a cached response is one where every source it names actually ran.
   */
  cached?: boolean;
  /**
   * How far apart two matches may sit and still be merged into one suggestion.
   *
   * Derived from the place type rather than fixed: 7.5 km for a church, 25 km
   * for a settlement, 150 km for a region. So a scatter threshold has to be a
   * fraction of this and never a constant, or it is inert for the small things
   * and fires on everything for the large ones.
   *
   * Only on the final frame; the preview does not carry it.
   */
  mergeRadiusKm?: number;
}

/** Vocabularies for the query form, from `GET /parameters`. */
export interface EngineParameters {
  regions: { id: string; label: string; bbox: [number, number, number, number]; parent?: string }[];
  periods: { id: string; label: string; start?: number; end?: number }[];
  languages: { id: string; label: string }[];
  /**
   * 13 entries, of which `any` is a query-side wildcard the engine never returns
   * as a result. Only the other 12 are mapped onto Concepts.
   */
  placeTypes: { id: string; label: string; description?: string }[];
}

/** One source's catalogue entry, from `GET /suggesters`. */
export interface EngineSuggester {
  name: string;
  category: "file" | "service";
  coverage: {
    regions?: string[];
    periods?: string[];
    languages?: string[];
    placeTypes?: string[];
  };
  health: { status: string; reason?: string };
  /** `min` is the floor a caller override is clamped to, and can differ per source. */
  weight: { default: number; min: number };
  /**
   * The occupancy grid built from this source's own records at startup, and
   * `null` for a source holding none locally.
   *
   * It is the evidence behind the region half of source relevance: `cells`
   * counts the 1° squares the source has any record in, so a large `records`
   * over few `cells` is a source concentrated somewhere. A `null` here means
   * the source is taken at its declaration instead, which always scores below a
   * measurement.
   */
  footprint: { records: number; cells: number } | null;
  info: {
    description?: string;
    homepage?: string;
    citation?: string;
    limitations?: string;
    license?: {
      id: string;
      label: string;
      url?: string;
      commercialUse: "yes" | "no" | "verify";
      shareAlike: boolean;
      attribution: boolean;
      attributionText?: string;
      notes?: string;
    };
  };
}

/** Why a researcher rejected every suggestion. Only meaningful with `chosen: null`. */
export type FeedbackReason = "not-found" | "ambiguous" | "other";

export interface FeedbackRequest {
  clientId?: string;
  query: SuggestRequest;
  /** `null` records "none of these are right", which the engine treats as first-class. */
  chosen: Suggestion | null;
  /** Required even on a rejection — the engine stores it verbatim for re-scoring. */
  suggestions: Suggestion[];
  reason?: FeedbackReason;
  note?: string;
}

/**
 * One entry of the engine's process-global audit log, from `GET /state/stream`.
 * `lastLog` names the pipeline stage in progress and updates while a request
 * runs, which is the only progress signal `/suggest` offers.
 */
/**
 * A name form on the live stream, while the request is still running.
 *
 * Narrower than the `EngineCandidate` the finished response carries: the stream
 * publishes what the engine is about to search and how well it thinks the form
 * denotes the place, and nothing about attestation or which model proposed it.
 */
export interface StreamCandidate {
  name: string;
  nameFit: number;
}

export interface EngineAuditEntry {
  id: string;
  name: string;
  clientId?: string;
  status: "started" | "active" | "failed" | "finished";
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  error?: string;
  lastLog?: string;
  /**
   * The name forms the engine will search, present once the naming phase ends.
   *
   * A snapshot rather than a line of commentary: correct whenever it is read,
   * and unaffected by a late connection, a dropped frame or a reconnect. The
   * `augment:` log line names the same forms, but `lastLog` holds one line and
   * the next stage overwrites it — the engine measured that line appearing in
   * no frame at all.
   *
   * Absent on a request the engine answered from its cache, which returns before
   * there is anything to watch. Those forms are on the response, in
   * `query.candidates`.
   */
  candidates?: StreamCandidate[];
  /**
   * Sources that ran to completion, and how many records each returned.
   *
   * Zero is a value and is present in the map: a source that searched and found
   * nothing is evidence. A source absent from all three maps has not answered
   * yet. Any of the three may be absent entirely rather than empty.
   */
  sourcesAnswered?: Record<string, number>;
  /** Sources that were asked and did not answer, and why. */
  sourcesFailed?: Record<string, string>;
  /**
   * Sources never attempted, and why.
   *
   * Complete in the first frame after the fan-out begins, before any source has
   * answered — which is what lets the board draw its full width immediately
   * rather than growing as results arrive.
   */
  sourcesExcluded?: Record<string, string>;
}

/**
 * One hit from `GET /search` — the fast, LLM-free lookup that drives the map's
 * own search box and names a point after a map click. Not a `Suggestion`: no
 * scoring, no convergence, no context pass, just what a gazetteer said.
 */
export interface EngineSearchHit {
  label: string;
  lat: number;
  lon: number;
  /** One of the engine's place types, or null. */
  type: string | null;
  source: string;
  sourceId?: string;
  sourceUrl?: string;
  /** True when the hit came from a local index rather than an external service. */
  local: boolean;
}

export interface EngineSearchResponse {
  hits: EngineSearchHit[];
  sources: SourceOutcome[];
  took_ms: number;
}

export interface EngineReverseResponse {
  /** Null when nothing sits near the coordinate. */
  hit: (EngineSearchHit & { distanceKm: number }) | null;
  sources: SourceOutcome[];
  took_ms: number;
}
