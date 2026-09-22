import { SuggestResponse } from "./engineTypes";

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

  // "none" is the augment stage saying it had no model to ask
  if ((response.query.candidates || []).some((candidate) => candidate.llmProvider === "none")) {
    notes.push(
      "only the name as written was searched — no historical name variants were generated",
    );
  }

  // `contextEvaluated` is absent on the preview frame, where the stage simply
  // has not run yet; false is the engine saying it did not run at all. Each
  // field is asked whether it says anything rather than whether it is there,
  // because `language` takes a list and an empty one is as truthy as a full one
  const { region, regionBbox, period, language, place_type } = response.query;
  const criteria =
    !!region ||
    !!regionBbox ||
    !!period ||
    !!place_type ||
    (Array.isArray(language) ? language.length > 0 : !!language);
  if (criteria && response.contextEvaluated === false) {
    notes.push("your period, region and language were not weighed against the results");
  }

  const broken = response.sources.filter(
    (source) => source.status === "failed" || source.partial || source.benched,
  );
  if (broken.length) {
    notes.push(
      `${broken.length} ${broken.length === 1 ? "source" : "sources"} did not answer in full: ` +
        broken.map((source) => source.name).join(", "),
    );
  }

  return notes;
};
