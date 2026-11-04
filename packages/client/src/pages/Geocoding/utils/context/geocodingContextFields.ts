import {
  DEFAULT_CONTEXT_WEIGHTS,
  GEOCODING_QUERY_DIMENSIONS,
  GeocodingBbox,
  GeocodingQueryDimension,
  IGeocodingContext,
  IGeocodingContextWeights,
} from "@inkvisitor/shared/types/geocoding";
import { EngineParameters } from "../../types/engine";
import { boxLabel, sameBox } from "../map/regionBox";

/**
 * The four fields the engine is asked a question with, and how much each counts.
 *
 * Named apart from the rest of the context because only these can make an
 * answer stale: `map click accuracy` decides what a later write records and
 * `region` decides which gazetteers were asked at all, so a change to the first
 * leaves the suggestions on screen exactly as valid as they were.
 *
 * The weights belong here for the same reason. They decide which gazetteers are
 * asked — a dimension weighted to zero stops vetoing as well as stops
 * counting — so an answer found under one set of weights is not an answer under
 * another, and the engine keeps the two under separate cache keys.
 */

export const QUERY_FIELDS = GEOCODING_QUERY_DIMENSIONS;

export type QueryField = GeocodingQueryDimension;

export const queryFieldLabel: Record<QueryField, string> = {
  region: "region",
  period: "period",
  language: "language",
  placeType: "kind of place",
};

/** What weighting each dimension changes, in the terms the choice is made in. */
export const queryFieldWeightNote: Record<QueryField, string> = {
  region:
    "How much a source's own records being in this area counts. It is the only dimension " +
    "measured rather than declared, which is why it starts at double the others. At zero, " +
    "region stops skipping sources as well as stops counting — every gazetteer then runs, " +
    "which is slower.",
  period:
    "How much a source covering these centuries counts. At zero, a source whose declared " +
    "periods miss yours is no longer skipped.",
  language:
    "How much a source indexing one of these languages counts. Language never skips a " +
    "source, only lifts one.",
  placeType:
    "How much a source declaring this kind of place counts. Kind of place never skips a " +
    "source, only lifts one.",
};

/** Nothing chosen. The engine reads an absent field as "do not use this". */
export const UNSET = "";

/**
 * Stands for a region drawn on the map, in a control whose other values are
 * names from the engine's own list.
 *
 * Never sent: the engine refuses `region` and `regionBbox` together, so the
 * request carries the box and no name. It exists so the picker can say which
 * region is in force when the answer is a rectangle, rather than reading as
 * though no region were set at all.
 */
export const CUSTOM_REGION = "__drawn__";

/** What a stored id is called, or the id itself where the engine cannot say. */
export const optionLabel = (
  parameters: EngineParameters | undefined,
  field: QueryField,
  value: string | undefined,
): string => {
  if (!value) {
    return "—";
  }
  return vocabulary(parameters, field).find((item) => item.id === value)?.label || value;
};

/** Several ids as one line, for a field that holds a list. */
export const optionLabels = (
  parameters: EngineParameters | undefined,
  field: QueryField,
  values: string[],
): string => (values.length ? values.map((value) => optionLabel(parameters, field, value)).join(", ") : "—");

const vocabulary = (
  parameters: EngineParameters | undefined,
  field: QueryField,
): { id: string; label: string }[] => {
  if (!parameters) {
    return [];
  }
  switch (field) {
    case "region":
      return parameters.regions;
    case "period":
      return parameters.periods;
    case "language":
      return parameters.languages;
    case "placeType":
      return parameters.placeTypes;
  }
};

/**
 * What a field offers, always including whatever it already holds.
 *
 * The vocabularies come from the engine, and this page works without it. A
 * value absent from the list it is chosen from draws as no value at all — so a
 * context set while the engine was reachable would read as blank the moment it
 * was not, and the first press on that field would blank it for real.
 *
 * No empty entry: a multiple choice says "none" by holding nothing, and an
 * option meaning nothing sitting among the values would be selectable
 * alongside them.
 */
export const contextMultiOptions = (
  parameters: EngineParameters | undefined,
  field: QueryField,
  current: string[],
): { value: string; label: string }[] => {
  const items = vocabulary(parameters, field);
  const options = items.map((item) => ({ value: item.id, label: item.label }));
  for (const value of current) {
    if (!items.some((item) => item.id === value)) {
      options.push({ value, label: value });
    }
  }
  return options;
};

/**
 * The regions on offer, with the drawn one among them where one is drawn.
 *
 * The drawn entry appears only while a box exists. Offered permanently it would
 * be a choice that does nothing — a region cannot be drawn from a dropdown —
 * and a control listing an option that refuses to be selected is worse than one
 * that does not list it.
 */
export const regionMultiOptions = (
  parameters: EngineParameters | undefined,
  context: IGeocodingContext,
): { value: string; label: string }[] => {
  const options = contextMultiOptions(parameters, "region", contextValues(context, "region"));
  if (context.regionBbox) {
    options.push({
      value: CUSTOM_REGION,
      label: `custom region — ${boxLabel(context.regionBbox)}`,
    });
  }
  return options;
};

/**
 * The regions in force. A drawn box outranks the names, which stay stored
 * underneath it and come back when the box is dropped.
 */
export const regionValues = (context: IGeocodingContext): string[] =>
  context.regionBbox ? [CUSTOM_REGION] : contextValues(context, "region");

/** The context field that holds each dimension as a list, and the one it was stored in before. */
const LIST_FIELD = {
  region: "regions",
  period: "periods",
  language: "languages",
  placeType: "placeTypes",
} as const;

const SINGLE_FIELD = {
  region: "region",
  period: "period",
  language: "language",
  placeType: "placeType",
} as const;

/**
 * What a dimension holds, as a list.
 *
 * Falls back to the single-value field a context saved before the dimension took
 * several still carries.
 */
export const contextValues = (context: IGeocodingContext, field: QueryField): string[] => {
  const list = context[LIST_FIELD[field]];
  if (list?.length) {
    return list;
  }
  const single = context[SINGLE_FIELD[field]];
  return single ? [single] : [];
};

/**
 * A year or a range of years as the engine reads one: `1400`, `-200`, `1200-1400`.
 *
 * Null where the text is neither. A reversed range is passed on as typed: the
 * engine reads it the right way round and says so, which is better told to the
 * researcher by it than corrected silently here.
 */
export const parsePeriodRange = (text: string): string | null => {
  const match = /^(-?\d{1,4})(?:\s*[-–—]\s*(-?\d{1,4}))?$/.exec(text.trim());
  if (!match) {
    return null;
  }
  return match[2] === undefined ? match[1] : `${match[1]}-${match[2]}`;
};

/**
 * Whether two lists of values say the same thing.
 *
 * Region, period and kind of place are sets, so the order they were chosen in
 * means nothing; language is the one list whose order is the researcher's own
 * statement of which is likelier.
 */
export const sameValues = (field: QueryField, a: string[], b: string[]): boolean =>
  field === "language"
    ? a.join(",") === b.join(",")
    : [...a].sort().join(",") === [...b].sort().join(",");

/** The languages the name is stated to be in. */
export const contextLanguages = (context: IGeocodingContext): string[] =>
  contextValues(context, "language");

/**
 * The same context with every dimension held as its list and the single-value
 * fields gone.
 *
 * Applied to each layer before the layers are merged: merged first, a personal
 * single value would sit beside a project's list, and the list would win — the
 * project's answer overruling the researcher's own.
 */
export const withListFields = (context: IGeocodingContext): IGeocodingContext => {
  const next: IGeocodingContext = { ...context };
  for (const field of QUERY_FIELDS) {
    const values = contextValues(context, field);
    if (values.length) {
      next[LIST_FIELD[field]] = values;
    } else {
      delete next[LIST_FIELD[field]];
    }
    delete next[SINGLE_FIELD[field]];
  }
  return next;
};

/**
 * What to write for a dimension: its list, and the single-value field blanked.
 *
 * Both, because a context saved before the list existed still carries its single
 * value, and a cleared list would otherwise bring that value back.
 */
export const valuesPatch = (field: QueryField, values: string[]): IGeocodingContext =>
  ({ [LIST_FIELD[field]]: values, [SINGLE_FIELD[field]]: UNSET }) as IGeocodingContext;

/** What one dimension counts, with the engine's own default underneath it. */
export const contextWeight = (context: IGeocodingContext, field: QueryField): number =>
  context.contextWeights?.[field] ?? DEFAULT_CONTEXT_WEIGHTS[field];

/** Whether this dimension has been moved off what the engine would do unasked. */
export const isWeightDefault = (weight: number, field: QueryField): boolean =>
  weight === DEFAULT_CONTEXT_WEIGHTS[field];

/**
 * Where the slider sits, on a scale whose middle is "as the engine would".
 *
 * The four dimensions do not share a default — region counts double, because it
 * is the only one measured rather than declared — so a slider showing the
 * engine's own number would have its neutral point in a different place on
 * every row, and there would be no reading of the column. This scale puts
 * neutral at the same place on all four: `NEUTRAL_STEP` of `WEIGHT_STEPS` is
 * whatever that dimension's default is, 0 is off, and the top is that default
 * doubled.
 */
export const WEIGHT_STEPS = 10;
export const NEUTRAL_STEP = 5;

export const weightToStep = (weight: number, field: QueryField): number =>
  Math.round((weight / DEFAULT_CONTEXT_WEIGHTS[field]) * NEUTRAL_STEP);

export const stepToWeight = (step: number, field: QueryField): number =>
  // two places is finer than any step can produce and keeps the round trip
  // exact, so a slider put back where it started sends nothing
  Math.round((DEFAULT_CONTEXT_WEIGHTS[field] * step * 100) / NEUTRAL_STEP) / 100;

/**
 * The weights to send, or nothing where every dimension sits at its default.
 *
 * Omitted rather than spelled out, because the weights are part of the engine's
 * cache key: a request stating the defaults in full asks the same question as
 * one stating nothing, and sending them would answer it from a second cache
 * entry.
 */
export const weightsToSend = (
  context: IGeocodingContext,
): IGeocodingContextWeights | undefined => {
  const moved = QUERY_FIELDS.filter(
    (field) => !isWeightDefault(contextWeight(context, field), field),
  );
  if (!moved.length) {
    return undefined;
  }
  return Object.fromEntries(moved.map((field) => [field, contextWeight(context, field)]));
};

/**
 * The gazetteers a request should tell the engine not to ask.
 *
 * Omitted where nothing is switched off, so a project that has never opened
 * either screen sends exactly what it sent before.
 */
export const disabledSourcesToSend = (context: IGeocodingContext): string[] | undefined =>
  context.disabledSources?.length ? context.disabledSources : undefined;

/** The area a request should carry, which is a drawn box or nothing. */
export const regionBoxToSend = (context: IGeocodingContext): GeocodingBbox | undefined =>
  context.regionBbox || undefined;

/**
 * The named region a request should carry.
 *
 * A drawn box replaces it entirely: the engine refuses a request carrying both
 * with 422 rather than choosing between them, and the box is the more recent
 * statement of where to look.
 */
export const regionToSend = (context: IGeocodingContext): string[] | undefined =>
  context.regionBbox ? undefined : listToSend(contextValues(context, "region"));

/** The values as the engine's list, or nothing at all: an empty field is left off the request. */
export const listToSend = (values: string[] | undefined): string[] | undefined =>
  values?.length ? values : undefined;

/** Whether an answer found under `then` still answers what `now` asks. */
export const queryContextChanged = (then: IGeocodingContext, now: IGeocodingContext): boolean =>
  // a set of values, so the order they were chosen in changes nothing; language
  // is the one list whose order is the researcher's own stated likelihood
  (["region", "period", "placeType"] as const).some(
    (field) =>
      [...contextValues(then, field)].sort().join(",") !==
      [...contextValues(now, field)].sort().join(","),
  ) ||
  !sameBox(then.regionBbox, now.regionBbox) ||
  // a source switched off is a source that was not asked, so an answer found
  // with it is not an answer to a question that excludes it — and one switched
  // back on is a source that has not been asked yet
  (then.disabledSources ?? []).join(",") !== (now.disabledSources ?? []).join(",") ||
  contextLanguages(then).join(",") !== contextLanguages(now).join(",") ||
  // the weights decide which sources are asked and how much each counts, so an
  // answer found under one set is not an answer under another — the engine
  // keeps them under separate cache keys for the same reason
  QUERY_FIELDS.some((field) => contextWeight(then, field) !== contextWeight(now, field)) ||
  // not a field of the panel, but it decides which name forms are searched, so
  // an answer produced under the other setting answers a different question —
  // the engine keeps both under separate cache keys for the same reason
  !!then.dedupeDiacritics !== !!now.dedupeDiacritics;
