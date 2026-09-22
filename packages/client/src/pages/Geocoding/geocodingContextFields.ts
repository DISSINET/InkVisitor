import { DropdownItem } from "@inkvisitor/shared/types";
import {
  DEFAULT_CONTEXT_WEIGHTS,
  GEOCODING_QUERY_DIMENSIONS,
  GeocodingBbox,
  GeocodingQueryDimension,
  IGeocodingContext,
  IGeocodingContextWeights,
} from "@inkvisitor/shared/types/geocoding";
import { EngineParameters } from "./engineTypes";
import { boxLabel, sameBox } from "./regionBox";

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

/**
 * A field answered with one value.
 *
 * Language is not one of them: it holds a list and is written through its own
 * setter, so the single-value path is closed to it by the type rather than by a
 * check nobody would run.
 */
export type SingleQueryField = Exclude<QueryField, "language">;

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
 */
export const contextOptions = (
  parameters: EngineParameters | undefined,
  field: QueryField,
  current: string | undefined,
): DropdownItem[] => {
  const items = vocabulary(parameters, field);
  const options: DropdownItem[] = [
    { value: UNSET, label: "—" },
    ...items.map((item) => ({ value: item.id, label: item.label })),
  ];
  if (current && current !== CUSTOM_REGION && !items.some((item) => item.id === current)) {
    options.push({ value: current, label: current });
  }
  return options;
};

/**
 * What a list-valued field offers.
 *
 * No empty entry: a multiple choice says "none" by holding nothing, and an
 * option meaning nothing sitting among the languages would be selectable
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
export const regionOptions = (
  parameters: EngineParameters | undefined,
  context: IGeocodingContext,
): DropdownItem[] => {
  const options = contextOptions(parameters, "region", context.region);
  if (context.regionBbox) {
    options.push({
      value: CUSTOM_REGION,
      label: `custom region — ${boxLabel(context.regionBbox)}`,
    });
  }
  return options;
};

/** Which entry of the region picker is in force. A drawn box outranks a name. */
export const regionValue = (context: IGeocodingContext): string =>
  context.regionBbox ? CUSTOM_REGION : context.region || UNSET;

/**
 * The languages the name is stated to be in.
 *
 * Falls back to the single-value field a context saved before this took several
 * still carries, which is read here and written nowhere.
 */
export const contextLanguages = (context: IGeocodingContext): string[] => {
  if (context.languages?.length) {
    return context.languages;
  }
  return context.language ? [context.language] : [];
};

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
export const regionToSend = (context: IGeocodingContext): string | undefined =>
  context.regionBbox ? undefined : context.region || undefined;

/** Whether an answer found under `then` still answers what `now` asks. */
export const queryContextChanged = (then: IGeocodingContext, now: IGeocodingContext): boolean =>
  (["region", "period", "placeType"] as const).some(
    (field) => (then[field] || UNSET) !== (now[field] || UNSET),
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
