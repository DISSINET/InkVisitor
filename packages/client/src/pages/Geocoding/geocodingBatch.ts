/**
 * What a run over a marked set has done so far.
 *
 * Kept as a record rather than as a count, because the interesting half of a
 * quick geocode is what it refused: a run reported as "9 of 12" says nothing
 * about which three were left, and those three are the work the researcher has
 * still to do. The record is built complete before the first request, so the
 * list has its full length from the first frame and does not grow under the eye.
 */

import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { Suggestion } from "./engineTypes";

export type BatchStepState = "waiting" | "running" | "written" | "skipped" | "failed";

export interface BatchStep {
  id: string;
  label: string;
  state: BatchStepState;
  /** Why it was skipped, or where it landed. Absent while it is waiting. */
  note?: string;
  /**
   * What the engine offered, kept so a refusal can be settled by hand.
   *
   * The refusals are the work a run leaves behind, and a researcher deciding one
   * needs the same answers the panel would have shown them. Kept on the step
   * rather than re-fetched, because the run has already paid for them and asking
   * again would be a second, differently-cached query.
   *
   * Off-region answers are not among them: a run that refused to write one
   * unasked should not then offer it as the thing to click.
   */
  choices?: Suggestion[];
  /**
   * The radius the engine grouped this run's matches within.
   *
   * Kept beside the choices because it is what makes them readable: how far
   * apart a suggestion's sources sit only means something against the distance
   * the engine was willing to merge, and that distance comes from the kind of
   * place — 7.5 km for a church, 150 km for a region. Absent where the run
   * produced no answer to keep it from.
   */
  mergeRadiusKm?: number;
  /** The one that was written, and how precisely it was said to locate. */
  taken?: { suggestion: Suggestion; accuracy: GeocodingAccuracy };
}

export interface BatchRun {
  steps: BatchStep[];
  /** True once the loop has left, whether it finished or was stopped. */
  done: boolean;
  /** Stopped by hand, which is why the tail is still waiting. */
  stopped: boolean;
}

export const batchStarting = (
  targets: { id: string; label: string }[],
): BatchRun => ({
  steps: targets.map(({ id, label }) => ({ id, label, state: "waiting" })),
  done: false,
  stopped: false,
});

/** The same run with one step in another state. Absent runs pass through. */
export const withStep = (
  run: BatchRun | null,
  id: string,
  state: BatchStepState,
  fields: Pick<BatchStep, "note" | "choices" | "taken" | "mergeRadiusKm"> = {},
): BatchRun | null =>
  run && {
    ...run,
    steps: run.steps.map((step) => (step.id === id ? { ...step, state, ...fields } : step)),
  };

/**
 * The answers worth offering for a Location the run would not decide.
 *
 * Off-region ones are dropped rather than ordered last. The run refused to write
 * one without being asked, and a list that then puts it in front of the
 * researcher as a thing to click has made the refusal decorative.
 */
export const choicesFrom = (suggestions: Suggestion[]): Suggestion[] =>
  suggestions.filter((one) => !one.offRegion);

/** A step still wanting a decision — what the run left behind. */
export const isUnsettled = (step: BatchStep): boolean =>
  step.state === "skipped" || step.state === "failed";

/**
 * The next Location still wanting a decision, after the one being looked at.
 *
 * Wraps, so working through twelve refusals is twelve presses rather than
 * eleven and a scroll back to the top. Null when there is nothing left, which
 * is what the control reads to take itself away.
 */
export const nextUnsettled = (run: BatchRun, after: string | null): string | null => {
  const unsettled = run.steps.filter(isUnsettled);
  if (!unsettled.length) {
    return null;
  }
  const at = after === null ? -1 : unsettled.findIndex((step) => step.id === after);
  return unsettled[(at + 1) % unsettled.length].id;
};

export interface BatchTally {
  written: number;
  skipped: number;
  failed: number;
  /** Never reached: the tail of a stopped run, and the step in flight. */
  waiting: number;
  total: number;
}

export const tallyOf = (run: BatchRun): BatchTally => {
  const count = (state: BatchStepState) =>
    run.steps.filter((step) => step.state === state).length;
  return {
    written: count("written"),
    skipped: count("skipped"),
    failed: count("failed"),
    waiting: count("waiting") + count("running"),
    total: run.steps.length,
  };
};

/**
 * The one line the bar shows, which has to be readable at a glance and true at
 * every moment of the run — including before anything has happened.
 */
export const batchSummary = (run: BatchRun): string => {
  const tally = tallyOf(run);
  if (!run.done) {
    const at = tally.written + tally.skipped + tally.failed + 1;
    return `geocoding ${Math.min(at, tally.total)} of ${tally.total}`;
  }
  const parts = [`${tally.written} geocoded`];
  if (tally.skipped) {
    parts.push(`${tally.skipped} left for you`);
  }
  if (tally.failed) {
    parts.push(`${tally.failed} failed`);
  }
  if (run.stopped && tally.waiting) {
    parts.push(`${tally.waiting} not reached`);
  }
  return parts.join(" · ");
};
