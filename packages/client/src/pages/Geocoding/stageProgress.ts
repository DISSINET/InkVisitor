import { GAZETTEERS } from "./gazetteerBaseUrls";

/**
 * Reading the engine's running commentary.
 *
 * `GET /state/stream` publishes one line per request saying what the pipeline is
 * doing — `gov: 52 results`, `wikidata: 7 results (1/3 candidates failed)`,
 * `suggest: 0 results from 11/16 suggesters`, `evaluate: 207 matches → 99
 * suggestions`. That is real work being reported as it happens, and it is the
 * only thing a request offers between the press and the answer.
 *
 * The engine owns these strings and will change them. Nothing here fails when it
 * does: an unrecognised line is a phase with no name, which draws the board
 * without advancing it, and the elapsed counter carries the wait either way.
 */

export type StagePhase =
  /** Asking a language model which name forms to search for. */
  | "naming"
  /** The sixteen gazetteers, answering in parallel. */
  | "asking"
  /** Matches grouped into places. */
  | "grouping"
  /** The strongest rated against the query's period and region. */
  | "rating"
  | "unknown";

export interface StageReading {
  phase: StagePhase;
  /** The gazetteer that just answered, where the line named one. */
  source?: string;
  /** How many records it found. Zero is an answer and is kept. */
  count?: number;
}

/**
 * The model's own coordinate guess: one of the sixteen suggesters the engine
 * always runs, but not a gazetteer with a record to cite.
 *
 * `GAZETTEERS` deliberately leaves it out — that list is the settings modal's
 * assignable Resources, and this one gets no Resource. The board's own notion
 * of "every source that will report" has no such reason to leave it out, so it
 * is added back for that one purpose rather than reused from a list scoped to
 * a different question.
 */
const LLM_GUESS_SOURCE = "llm-coords";

/**
 * Every source the board can name on the first frame, whether or not it can
 * cite a record.
 *
 * Kept apart from `readSources`' own `sourceOrder`, which still has to handle a
 * source named by neither list: the engine adds suggesters over time, and a
 * name this client has never heard of is drawn once it is reported rather than
 * silently dropped.
 */
export const KNOWN_SOURCES = [...GAZETTEERS, LLM_GUESS_SOURCE];

const SOURCES = new Set<string>(KNOWN_SOURCES);

const PHASES: Record<string, StagePhase> = {
  criteria: "naming",
  augment: "naming",
  suggest: "grouping",
  evaluate: "rating",
};

export const readStage = (log: string | null): StageReading => {
  const head = /^([a-z-]+):/.exec((log || "").trim())?.[1];
  if (!head) {
    return { phase: "unknown" };
  }
  if (SOURCES.has(head)) {
    const count = /: (\d+) results/.exec(log as string)?.[1];
    return { phase: "asking", source: head, count: count === undefined ? undefined : +count };
  }
  return { phase: PHASES[head] || "unknown" };
};

/** What the board says about one source, and what a cell draws. */
export type SourceState = "answered" | "empty" | "failed" | "excluded" | "waiting";

export interface SourceReading {
  source: string;
  state: SourceState;
  /** Records found, for a source that answered. */
  count?: number;
  /** Why it failed or was excluded, in the engine's words. */
  reason?: string;
}

/**
 * Every source the board draws, in a stable order.
 *
 * The known sources first, in their own order, then anything the engine named
 * that this client does not know about at all. The engine owns the source
 * list and adds to it; a board built only from the client's list silently
 * drops whatever it has not heard of, and the count beside it then disagrees
 * with the cells.
 *
 * Stable order because the board is read by position: a grid that reordered
 * itself as sources answered would make the reader find each cell again on
 * every frame. The known sources are drawn from the first frame regardless of
 * whether any has reported, which is what keeps this list — and so the
 * board's height — from growing the moment one of them does; only a source
 * genuinely outside `KNOWN_SOURCES` can still add a row mid-run, because
 * nothing announces its name in advance.
 */
const sourceOrder = (progress: {
  answered: Record<string, number>;
  failed: Record<string, string>;
  excluded: Record<string, string>;
}): string[] => {
  const extra = [
    ...Object.keys(progress.answered),
    ...Object.keys(progress.failed),
    ...Object.keys(progress.excluded),
  ]
    .filter((source) => !KNOWN_SOURCES.includes(source))
    .sort();
  return [...KNOWN_SOURCES, ...new Set(extra)];
};

/**
 * What the engine currently says about every source.
 *
 * Absent from all three maps means the source has not answered yet, which is
 * why "waiting" is the fallback rather than a state the engine publishes.
 */
export const readSources = (progress: {
  answered: Record<string, number>;
  failed: Record<string, string>;
  excluded: Record<string, string>;
}): SourceReading[] =>
  sourceOrder(progress).map((source) => {
    const count = progress.answered[source];
    if (count !== undefined) {
      // zero is an answer: the source searched and found nothing, which is
      // evidence rather than a source still working
      return { source, state: count === 0 ? "empty" : "answered", count };
    }
    if (progress.failed[source] !== undefined) {
      return { source, state: "failed", reason: progress.failed[source] };
    }
    if (progress.excluded[source] !== undefined) {
      return { source, state: "excluded", reason: progress.excluded[source] };
    }
    return { source, state: "waiting" };
  });

/**
 * The four phases in the order the pipeline runs them.
 *
 * A phase is never revisited, so a line naming one is also evidence that every
 * phase before it finished — which is the only way the panel can mark a step
 * done. The stream is sampled about once a second and the gazetteers answer in
 * parallel within two, so most lines are never observed at all; reading a
 * skipped phase as complete is what makes the rail survive that.
 */
export const PHASE_ORDER: StagePhase[] = ["naming", "asking", "grouping", "rating"];

/** How far along a phase sits, or -1 for a line the engine has since reworded. */
export const phaseRank = (phase: StagePhase): number => PHASE_ORDER.indexOf(phase);

/**
 * The furthest phase reached, given the one just read.
 *
 * Monotonic: an unrecognised line leaves the rail where it stood rather than
 * dropping it back to the start.
 */
export const advance = (reached: number, phase: StagePhase): number =>
  Math.max(reached, phaseRank(phase));

/** How many sources have reported, out of those that ever will. */
export const sourceTally = (readings: SourceReading[]): { heard: number; expected: number } => ({
  heard: readings.filter((one) => one.state !== "waiting" && one.state !== "excluded").length,
  expected: readings.filter((one) => one.state !== "excluded").length,
});

/** What the panel says it is doing, in words a researcher can act on. */
export const PHASE_WORDS: Record<StagePhase, string> = {
  naming: "working out which names to search for",
  asking: "asking the gazetteers",
  grouping: "grouping what came back into places",
  rating: "rating the strongest against your period and region",
  unknown: "working",
};
