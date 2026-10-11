import { SuggestResponse } from "../../types/engine";

/**
 * What the engine changed about the question, in its own words.
 *
 * Not a degradation: an entry it did not know or a range it turned round is
 * the question being read differently from how it was asked, and nothing is
 * missing from the answer or worth running again. Kept apart from
 * `degradationsOf` so the two are never told in one sentence.
 */
export const problemsOf = (response: SuggestResponse): string[] =>
  (response.problems ?? [])
    .filter((problem) => !BUDGET_CODES.includes(problem.code))
    .map((problem) => problem.message);

const BUDGET_CODES: string[] = ["llm-budget-spent", "llm-budget-low"];

/**
 * Whether the engine's daily language-model allowance was used up for this
 * answer. Said as a degradation rather than a problem: the answer is real and
 * weaker, and running it again tomorrow gives a better one. `llm-budget-low`
 * skipped nothing, so it is not reported.
 */
export const budgetSpent = (response: SuggestResponse): boolean =>
  (response.problems ?? []).some((problem) => problem.code === "llm-budget-spent");

/**
 * What went wrong in a request the engine still answered with HTTP 200.
 *
 * A rate-limited language model does not fail the request. `augment` falls back
 * to searching the bare name and `evaluate-context` leaves every `contextFit`
 * null, and what comes back is a plausible-looking result computed without
 * either language-model stage. It also returns SOONER, because one name variant
 * skips most of the gazetteer queue - so a run measured in places per minute
 * speeds up at the moment its quality collapses.
 *
 * Nothing here blocks accepting a suggestion. The researcher may recognise the
 * place regardless; what they cannot do is notice this by looking.
 */
export const degradationsOf = (response: SuggestResponse): string[] => {
  const notes: string[] = [];
  const spent = budgetSpent(response);
  if (spent) {
    // one sentence for both stages it takes away, so the two notes below do not
    // repeat it
    notes.push(
      "the engine's language-model allowance for today is used up, so no historical name " +
        "variants were generated and your context was not weighed — results are less complete right now"
    );
  }

  // "none" is the augment stage saying it had no model to ask
  if (
    !spent &&
    (response.query.candidates || []).some((candidate) => candidate.llmProvider === "none")
  ) {
    notes.push(
      "only the name as written was searched — no historical name variants were generated"
    );
  }

  // `contextEvaluated` is absent on the preview frame, where the stage simply
  // has not run yet; false is the engine saying it did not run at all. Each
  // field is asked whether it says anything rather than whether it is there,
  // because `language` takes a list and an empty one is as truthy as a full one
  const { region, regionBbox, period, language, place_type } = response.query;
  const criteria =
    !!region?.length ||
    !!regionBbox ||
    !!period?.length ||
    !!place_type?.length ||
    !!language?.length;
  if (!spent && criteria && response.contextEvaluated === false) {
    notes.push("your period, region and language were not weighed against the results");
  }

  const broken = response.sources.filter(
    (source) => source.status === "failed" || source.partial || source.benched
  );
  if (broken.length) {
    notes.push(
      `${broken.length} ${broken.length === 1 ? "source" : "sources"} did not answer in full: ` +
        broken.map((source) => source.name).join(", ")
    );
  }

  return notes;
};
