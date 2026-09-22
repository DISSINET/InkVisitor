import { EngineSuggester } from "./engineTypes";
import { GAZETTEERS } from "./gazetteerBaseUrls";

/**
 * The gazetteers the engine can ask, and what it knows about each.
 *
 * The engine owns this list and publishes it from `GET /suggesters`. This page
 * works without the engine, so there is a fallback list of names underneath —
 * a settings screen that showed nothing whenever the engine was down would let
 * a researcher believe the project had switched everything off.
 */

/** The model's own coordinate guess. A source the engine asks, not a gazetteer. */
export const LLM_SOURCE = "llm-coords";

/**
 * Every source the engine asks, in the order these screens list them.
 *
 * `llm-coords` last and apart: it is the language model's own guess rather than
 * a record in anybody's database, so it is the one entry here that answers with
 * no source behind it — and the one most often worth switching off.
 */
export const ALL_SOURCES = [...GAZETTEERS, LLM_SOURCE];

/** One row of the picker, whether or not the engine could be reached. */
export interface GazetteerRow {
  name: string;
  /** Absent when the engine is unreachable; the row is then a name and a switch. */
  suggester?: EngineSuggester;
}

/**
 * The rows to draw: what the engine published, with anything it did not mention
 * kept underneath.
 *
 * Ordered by the static list rather than by the engine's own order, so the rows
 * do not move about between one load and the next. A source the engine has
 * grown that this list has never heard of is appended rather than dropped —
 * the engine owns the list, and a settings screen that silently omitted one
 * would offer no way to switch it off.
 */
export const gazetteerRows = (suggesters: EngineSuggester[] | undefined): GazetteerRow[] => {
  const byName = new Map((suggesters ?? []).map((one) => [one.name, one]));
  const rows: GazetteerRow[] = ALL_SOURCES.map((name) => ({
    name,
    suggester: byName.get(name),
  }));
  for (const suggester of suggesters ?? []) {
    if (!ALL_SOURCES.includes(suggester.name)) {
      rows.push({ name: suggester.name, suggester });
    }
  }
  return rows;
};

/**
 * What the engine measured of a source's own records, in words.
 *
 * `cells` counts the one-degree squares the source holds any record in, so the
 * two numbers together say whether a source is large or merely spread: 621,528
 * records in 340 cells is a source that is about one place, and 2,057 in 1,292
 * is one that is about everywhere and thin.
 *
 * A source with no local records is not measured at all — it is a remote API,
 * and the engine falls back to how specific its own declaration is. That always
 * scores below a measurement, which is the sentence this has to convey.
 */
export const footprintNote = (suggester: EngineSuggester | undefined): string => {
  if (!suggester) {
    return "the engine has not been reached, so nothing is known about this one";
  }
  const { footprint } = suggester;
  if (!footprint) {
    return (
      "no local records to measure — its region relevance comes from what it declares " +
      "about itself, which always scores below a measurement"
    );
  }
  return (
    `${footprint.records.toLocaleString()} records across ${footprint.cells.toLocaleString()} ` +
    `one-degree cells, counted from the source's own coordinates`
  );
};

/** The short form, for a column that has to line up down the list. */
export const footprintFigure = (suggester: EngineSuggester | undefined): string => {
  if (!suggester) {
    return "—";
  }
  if (!suggester.footprint) {
    return "declared";
  }
  const { records, cells } = suggester.footprint;
  // records are compacted and cells are not: records run to six figures and
  // their exact value decides nothing, while cells top out under two thousand
  // and are the whole of what the column says — 2,057 records over 1,292 cells
  // is a source about everywhere and thin, and rounding that to "1k cells"
  // makes it read the same as one about a single country
  return `${compact(records)} · ${cells.toLocaleString()} cells`;
};

/** Thousands as `34k`, so sixteen rows of figures stay a column rather than a paragraph. */
const compact = (value: number): string =>
  value >= 1000 ? `${Math.round(value / 1000).toLocaleString()}k` : String(value);

/** Whether the engine says this source can answer at all. */
export const isHealthy = (suggester: EngineSuggester | undefined): boolean =>
  !suggester || suggester.health.status === "ready";

/**
 * A source switched off, or switched back on.
 *
 * Sorted and de-duplicated so the stored list has one form: it is compared
 * against the other layer's and against what was saved, and two orderings of
 * the same refusal would read as a change.
 */
export const withSource = (disabled: string[], name: string, off: boolean): string[] => {
  const next = new Set(disabled);
  if (off) {
    next.add(name);
  } else {
    next.delete(name);
  }
  return Array.from(next).sort();
};
