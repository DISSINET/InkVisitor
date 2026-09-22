import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { SuggestResponse, Suggestion } from "./engineTypes";
import { splitLabel } from "./suggestionLabel";
import { bandOf } from "./suggestionRank";
import { scatterOf } from "./suggestionScatter";

/**
 * Taking an answer without looking at it.
 *
 * A corpus has thousands of Locations and most of them are unambiguous; reading
 * every run to press the same button is the work this removes. What it must not
 * do is guess — so the decision is a pure function with its refusals written
 * down, and a run it will not decide is reported as skipped rather than taken
 * on the strength of a number.
 */

export type QuickStrategy = "clearWinner" | "topScore";

/**
 * What each strategy will accept, said in the terms the choice is made in.
 *
 * "Whichever scores highest" is not reckless — the engine's order is the engine's
 * best answer and the researcher can see what was written afterwards. It is a
 * statement about the corpus: one where a wrong coordinate is cheaper to correct
 * than a missing one is cheap to find.
 */
export const QUICK_STRATEGY_MEANING: Record<QuickStrategy, string> = {
  clearWinner:
    "Only where one answer is ahead of the rest by more than the engine's own margin. Anything closer is left for a person.",
  topScore: "Whichever answer scores highest, however close the second is.",
};

/**
 * What a quick geocode is allowed to accept, beyond which answer it picks.
 *
 * Separate from the strategy because it is a different question. The strategy
 * asks how sure the engine has to be; this asks whether an answer the engine
 * itself flagged as outside the query counts at all.
 */
export interface QuickRules {
  strategy: QuickStrategy;
  /**
   * Whether an answer outside the query's region may be taken.
   *
   * The engine demotes these rather than hiding them, because a corpus does
   * cross its own borders — an exile's monastery, a bishop's other see. What it
   * does not do is decide, and this is the one refusal that survives a clear
   * winner: the score says how well the sources agree about a name, not whether
   * the place they agree on is one this corpus can contain.
   */
  takeOffRegion?: boolean;
}

/**
 * How many of the tied answers are named before the count takes over.
 *
 * Two names is the case worth naming — "Frankfurt am Main and Frankfurt an der
 * Oder are too close to call" is the whole explanation, where "2 answers are
 * within the engine's own margin" leaves the researcher to go and look. Past
 * three the names stop being a sentence and become a list, and the count says
 * more than a list read at a glance.
 */
const NAMES_IN_REFUSAL = 3;

/**
 * How much of a place's administrative path is used to tell it from a namesake.
 *
 * `Pierce, Nebraska, ... World` says everything it needs to in two, and the tail
 * of every one of these paths is the same word.
 */
const REGION_PARTS = 2;

/**
 * The tied answers, named so they can be told apart.
 *
 * The bare name is enough where the names differ — two medieval Frankfurts are
 * `Frankfurt am Main` and `Frankfurt an der Oder`, and that is the whole
 * explanation. Where they do not differ it is no explanation at all: four
 * suggestions for `Breslau` are four identical words until the administrative
 * path is put back, and the path is the entire difference between Pierce County
 * Nebraska and Lavaca County Texas.
 */
export const namesOfTied = (suggestions: Suggestion[]): string[] => {
  const split = suggestions.map((one) => splitLabel(one.label));
  const collides = (name: string) => split.filter((one) => one.name === name).length > 1;
  return split.map(({ name, region }) => {
    if (!collides(name) || !region) {
      return name;
    }
    const where = region.split(",").map((part) => part.trim()).slice(0, REGION_PARTS);
    return `${name} (${where.join(", ")})`;
  });
};

/**
 * Why a run would not decide, said in the places it would not decide between.
 *
 * A refusal is read away from the answers it is about — in a toast, or in a
 * batch report a hundred rows long — so the names have to travel with it. What
 * the reader needs is which places the engine could not separate, and the count
 * alone never says that.
 */
export const tooCloseToCall = (suggestions: Suggestion[], size: number): string => {
  const shown = Math.min(size, NAMES_IN_REFUSAL);
  const names = namesOfTied(suggestions.slice(0, shown));
  if (size > NAMES_IN_REFUSAL) {
    return `${size} answers are too close to call: ${names.join(", ")}, and ${size - NAMES_IN_REFUSAL} more`;
  }
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are too close to call`;
};

export type QuickPick =
  | { take: Suggestion; index: number; accuracy: GeocodingAccuracy }
  /** Why nothing was taken, in words a researcher can act on. */
  | { skip: string };

export const isTaken = (pick: QuickPick): pick is Extract<QuickPick, { take: Suggestion }> =>
  "take" in pick;

/**
 * Which suggestion a quick geocode writes, if any.
 *
 * The accuracy comes from the same spread the card leads with rather than from a
 * setting: how precisely a coordinate locates a place is a fact about the
 * sources that answered, and a preference that overrode it would record a claim
 * nobody made.
 *
 * An answer the engine flagged as off-region is refused whatever its score,
 * unless the corpus says otherwise — see `QuickRules`.
 *
 * A run of exactly one suggestion is a clear winner under either strategy —
 * there is nothing for it to be confused with. `bandOf` says nothing about such
 * a run, because a margin needs two scores to be a margin.
 */
export const quickPick = (
  response: SuggestResponse | null,
  rules: QuickRules,
): QuickPick => {
  const { strategy, takeOffRegion = false } = rules;
  const suggestions = response?.suggestions ?? [];
  const top = suggestions[0];
  if (!response || !top) {
    return { skip: "no gazetteer offered a place" };
  }
  // asked of the answer before anything is asked of the run, and it outranks a
  // clear lead: being ahead of the other answers says nothing about whether the
  // place is one the query was looking for
  if (top.offRegion && !takeOffRegion) {
    return { skip: "the best answer is outside the region the query asked about" };
  }
  const accuracy = scatterOf(top, response.mergeRadiusKm).leadAccuracy;
  const taken = { take: top, index: 0, accuracy };
  if (strategy === "topScore" || suggestions.length === 1) {
    return taken;
  }
  const band = bandOf(response);
  if (!band) {
    // the engine publishes a margin on every real response; without one there
    // is no measure of "ahead", and inventing one from the scores would be a
    // different rule wearing this rule's name
    return { skip: "the engine reported no margin, so nothing here is a clear winner" };
  }
  if (!band.clear) {
    return { skip: tooCloseToCall(suggestions, band.size) };
  }
  return taken;
};
