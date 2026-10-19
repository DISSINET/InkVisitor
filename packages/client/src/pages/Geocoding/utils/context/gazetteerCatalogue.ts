import { EngineSuggester } from "../../types/engine";
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
